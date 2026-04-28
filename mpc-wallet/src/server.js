'use strict';

/**
 * server.js — MPC 参与方 Web 服务
 * 用法: node server.js <partyId> <port>
 *   node server.js 1 3001
 *   node server.js 2 3002
 *   node server.js 3 3003
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const {
  N, randomScalar,
  pointMul, pointToBytes, pointFromBytes,
  pubKeyToAddress, bigIntToHex, bigIntToBytes32,
} = require('./field');

const {
  createPolynomial,
  evaluatePolynomial,
  verifyShard,
  lagrangeInterpolateAtZero,
} = require('./vss');

const {
  lagrangeCoeff,
  toAdditiveShare,
  signerA_Round1,
  signerB_Round2,
  signerA_Round3,
  verifySignature,
} = require('./tss');

const {
  deriveRootChainCode,
  deriveChildPublicKey,
  derivePathPublicKey,
  deriveBIP44Addresses,
  applyTweaksToKeyShare,
  encodeXPUB,
} = require('./hdwallet');

const { modInv } = require('./vss');

const partyId = parseInt(process.argv[2], 10);
const port    = parseInt(process.argv[3], 10);

if (!partyId || !port) {
  console.error('用法: node server.js <partyId 1|2|3> <port>');
  process.exit(1);
}

// ─── 内存状态（每个参与方独立持有）──────────────────────────────
const state = {
  partyId,
  n: 3,
  t: 2,
  // DKG Phase 1
  secretScalar: null,
  coefficients: null,
  commitments: null,      // 公开
  // DKG Phase 2
  receivedShards: {},     // { fromId: bigint }
  selfShard: null,
  // DKG Phase 3
  keyShare: null,         // 私密
  groupPublicKey: null,   // 公开
  address: null,          // 公开
  chainCode: null,        // 公开
  // TSS signing
  signerRole: null,       // 'A' | 'B'
  kA: null,               // 私密 (role A)
  R_A: null,              // 公开 (role A)
  signerPartners: null,
  pendingMsgHash: null,
  lastSignature: null,
  // HD
  derivedAddresses: [],
};

// ─── 序列化 BigInt ────────────────────────────────────────────────
function serialize(obj) {
  return JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? '0x' + v.toString(16) : v
  );
}

function parseBigHex(s) {
  if (typeof s === 'string' && s.startsWith('0x')) return BigInt(s);
  if (typeof s === 'bigint') return s;
  return BigInt('0x' + s);
}

// ─── 路由处理 ────────────────────────────────────────────────────
const routes = {};

function route(method, path, handler) {
  routes[`${method} ${path}`] = handler;
}

// GET /state — 返回当前完整状态（供前端展示）
route('GET', '/state', (req, res) => {
  const out = {
    partyId: state.partyId,
    phase: currentPhase(),
    dkg: {
      secretScalar: state.secretScalar ? { value: bigIntToHex(state.secretScalar), private: true } : null,
      coefficients: state.coefficients ? {
        value: state.coefficients.map(c => bigIntToHex(c)),
        private: true
      } : null,
      commitments: state.commitments ? {
        value: state.commitments.map(c => Buffer.from(c).toString('hex')),
        private: false
      } : null,
      receivedShards: Object.keys(state.receivedShards).length > 0 ? {
        value: Object.fromEntries(
          Object.entries(state.receivedShards).map(([k, v]) => [k, bigIntToHex(v)])
        ),
        private: true
      } : null,
      selfShard: state.selfShard ? { value: bigIntToHex(state.selfShard), private: true } : null,
      keyShare: state.keyShare ? { value: bigIntToHex(state.keyShare), private: true } : null,
      groupPublicKey: state.groupPublicKey ? {
        value: Buffer.from(state.groupPublicKey).toString('hex'),
        private: false
      } : null,
      address: state.address ? { value: state.address, private: false } : null,
      xpub: (state.groupPublicKey && state.chainCode)
        ? { value: encodeXPUB(state.groupPublicKey, state.chainCode), private: false }
        : null,
    },
    hd: {
      chainCode: state.chainCode ? {
        value: state.chainCode.toString('hex'),
        private: false
      } : null,
      derivedAddresses: state.derivedAddresses,
    },
    tss: {
      signerRole: state.signerRole,
      R_A: state.R_A ? { value: Buffer.from(state.R_A).toString('hex'), private: false } : null,
      pendingMsgHash: state.pendingMsgHash ? {
        value: bigIntToHex(state.pendingMsgHash), private: false
      } : null,
      lastSignature: state.lastSignature,
    }
  };
  respond(res, 200, out);
});

// POST /dkg/phase1 — 初始化，生成多项式和承诺
route('POST', '/dkg/phase1', (req, res, body) => {
  const secretScalar = randomScalar();
  const { coefficients, commitments } = createPolynomial(secretScalar, state.t);

  //私密常数项
  state.secretScalar = secretScalar;
  //完整多项式系数（仅本方持有）
  state.coefficients = coefficients;
  //公开承诺
  state.commitments = commitments;

  // 自己的分片 f_i(i)
  state.selfShard = evaluatePolynomial(coefficients, BigInt(partyId));
  state.receivedShards[partyId] = state.selfShard;

  respond(res, 200, {
    ok: true,
    // 返回给其他方的公开数据
    partyId,
    commitments: commitments.map(c => Buffer.from(c).toString('hex')),
    // 各方应收到的私密分片（实际中分别加密发送）
    shardsForOthers: {
      1: bigIntToHex(evaluatePolynomial(coefficients, 1n)),
      2: bigIntToHex(evaluatePolynomial(coefficients, 2n)),
      3: bigIntToHex(evaluatePolynomial(coefficients, 3n)),
    }
  });
});

// POST /dkg/phase2 — 接收来自其他方的分片和承诺，验证并存储
route('POST', '/dkg/phase2', (req, res, body) => {
  const { fromPartyId, shard, commitments } = body;
  const fromId = parseInt(fromPartyId);

  if (fromId === partyId) {
    return respond(res, 400, { error: '不能给自己发送分片（已在 phase1 自动处理）' });
  }

  const shardBig = parseBigHex(shard);
  const commitmentBufs = commitments.map(c => Buffer.from(c, 'hex'));

  // Feldman VSS 验证
  const valid = verifyShard(shardBig, partyId, commitmentBufs);
  if (!valid) {
    return respond(res, 400, { error: `来自方 ${fromId} 的分片验证失败！` });
  }

  state.receivedShards[fromId] = shardBig;

  respond(res, 200, {
    ok: true,
    verified: true,
    fromPartyId: fromId,
    shardReceived: bigIntToHex(shardBig),
    totalReceived: Object.keys(state.receivedShards).length,
  });
});

// POST /dkg/phase3 — 聚合分片，生成密钥材料
// 需要传入所有方的承诺（用于计算公钥）
route('POST', '/dkg/phase3', (req, res, body) => {
  const { allCommitments } = body;
  // allCommitments: { "1": ["hex","hex"], "2": [...], "3": [...] }

  if (Object.keys(state.receivedShards).length < state.n) {
    return respond(res, 400, {
      error: `分片不足: 已有 ${Object.keys(state.receivedShards).length}/${state.n}`
    });
  }

  // 聚合私钥分片
  let keyShare = 0n;
  for (const shard of Object.values(state.receivedShards)) {
    keyShare = (keyShare + shard) % N;
  }
  state.keyShare = keyShare;

  // 计算全局公钥 P = Σ Cᵢ₀
  let pubPoint = null;
  for (let i = 1; i <= state.n; i++) {
    const comms = allCommitments[i].map(c => Buffer.from(c, 'hex'));
    const C0 = pointFromBytes(comms[0]);
    pubPoint = pubPoint === null ? C0 : pubPoint.add(C0);
  }

  state.groupPublicKey = pointToBytes(pubPoint);
  state.address = pubKeyToAddress(pubPoint);
  state.chainCode = deriveRootChainCode(state.groupPublicKey);

  respond(res, 200, {
    ok: true,
    keyShare: { value: bigIntToHex(keyShare), private: true },
    groupPublicKey: { value: Buffer.from(state.groupPublicKey).toString('hex'), private: false },
    address: { value: state.address, private: false },
    chainCode: { value: state.chainCode.toString('hex'), private: false },
    xpub: { value: encodeXPUB(state.groupPublicKey, state.chainCode), private: false },
  });
});

// POST /hd/derive — 派生收款地址 (BIP-44)
route('POST', '/hd/derive', (req, res, body) => {
  if (!state.groupPublicKey) {
    return respond(res, 400, { error: 'DKG 尚未完成' });
  }
  const count = parseInt(body.count) || 5;
  const change = parseInt(body.change) || 0;

  // MPC 主公钥视为 BIP-44 account 层 (m/44'/60'/0')
  // 公钥侧只派生最后两层: change / address_index
  const addresses = deriveBIP44Addresses(state.groupPublicKey, state.chainCode, count, 0, change);
  state.derivedAddresses = addresses;
  respond(res, 200, { ok: true, addresses });
});

// POST /tss/init — 发起方（方 A）轮次 1
route('POST', '/tss/init', (req, res, body) => {
  if (!state.keyShare) return respond(res, 400, { error: 'DKG 尚未完成' });

  const { msgHash, partnerIds, message } = body;

  // 如果提供原始消息，用 Ethereum personal_sign 格式哈希；否则直接用 msgHash
  let finalHash;
  if (message) {
    const { hashMessage } = require('./field');
    finalHash = hashMessage(message);
  } else {
    finalHash = parseBigHex(msgHash);
  }

  state.pendingMsgHash = finalHash;
  state.signerRole = 'A';
  state.signerPartners = partnerIds;

  const { kA, R_A } = signerA_Round1();
  state.kA = kA;
  state.R_A = R_A;

  respond(res, 200, {
    ok: true,
    role: 'A',
    R_A: { value: Buffer.from(R_A).toString('hex'), private: false },
    msgHash: bigIntToHex(state.pendingMsgHash),
  });
});

// POST /tss/respond — 协作方（方 B）轮次 2
route('POST', '/tss/respond', (req, res, body) => {
  if (!state.keyShare) return respond(res, 400, { error: 'DKG 尚未完成' });

  const { R_A, msgHash, partyAId, signers } = body;
  // signers: [idA, idB]

  const idA = parseInt(partyAId);
  const idB = partyId;
  const twoSigners = [idA, idB];

  state.signerRole = 'B';
  state.signerPartners = twoSigners;
  state.pendingMsgHash = parseBigHex(msgHash);

  const R_ABuf = Buffer.from(R_A, 'hex');
  const msgHashBig = state.pendingMsgHash;

  // 计算双方的加法 x 分片（需要方 A 的分片，真实协议通过 MtA 盲化）
  // 这里前端需要提供方 A 的 keyShare（教学场景）
  const xShares = body.xShares; // { "1": "0x...", "2": "0x..." }
  const xShareA = parseBigHex(xShares[idA]);
  const xShareB = state.keyShare;

  const xHatA = toAdditiveShare(xShareA, idA, twoSigners);
  const xHatB = toAdditiveShare(xShareB, idB, twoSigners);

  const { r, gammaB, deltaB, R, kB } = signerB_Round2(R_ABuf, msgHashBig, xHatA, xHatB);

  state._gammaB = gammaB;
  state._deltaB = deltaB;
  state._r = r;

  respond(res, 200, {
    ok: true,
    role: 'B',
    r: { value: bigIntToHex(r), private: false },
    R: { value: Buffer.from(R).toString('hex'), private: false },
    gammaB: { value: bigIntToHex(gammaB), private: false },
    deltaB: { value: bigIntToHex(deltaB), private: false },
  });
});

// POST /tss/finalize — 发起方（方 A）轮次 3，完成签名
route('POST', '/tss/finalize', (req, res, body) => {
  if (state.signerRole !== 'A') return respond(res, 400, { error: '本方不是发起方' });

  const { gammaB, deltaB, r } = body;
  const gammaBig = parseBigHex(gammaB);
  const deltaBig = parseBigHex(deltaB);
  const rBig = parseBigHex(r);

  const s = signerA_Round3(state.kA, gammaBig, deltaBig);

  // 验证
  const valid = verifySignature(state.pendingMsgHash, { r: rBig, s }, state.groupPublicKey);

  state.lastSignature = {
    r: bigIntToHex(rBig),
    s: bigIntToHex(s),
    valid,
  };

  respond(res, 200, {
    ok: true,
    signature: state.lastSignature,
    msgHash: bigIntToHex(state.pendingMsgHash),
    verified: valid,
  });
});

// GET /party-info — 返回本方 ID 和端口
route('GET', '/party-info', (req, res) => {
  respond(res, 200, { partyId, port });
});

// ─── 辅助函数 ────────────────────────────────────────────────────
function currentPhase() {
  if (!state.secretScalar) return 0;
  if (!state.keyShare) return Object.keys(state.receivedShards).length < state.n ? 2 : 2.5;
  if (state.derivedAddresses.length === 0) return 3;
  return 4;
}

function respond(res, status, data) {
  const body = typeof data === 'string' ? data : serialize(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

// ─── HTTP 服务器 ─────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // 静态文件
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  const key = `${req.method} ${req.url.split('?')[0]}`;
  const handler = routes[key];

  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found', path: req.url }));
  }

  let rawBody = '';
  req.on('data', chunk => rawBody += chunk);
  req.on('end', () => {
    let body = {};
    try { body = rawBody ? JSON.parse(rawBody) : {}; } catch {}
    try { handler(req, res, body); } catch (e) {
      respond(res, 500, { error: e.message });
    }
  });
});

server.listen(port, () => {
  console.log(`\n  MPC 参与方 ${partyId} 已启动`);
  console.log(`  地址: http://localhost:${port}`);
  console.log(`  方 ID: ${partyId} / 总方数: 3 / 门限: 2\n`);
});
