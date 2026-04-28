'use strict';

/**
 * hdwallet.js — 基于 MPC 公钥的 HD 派生（公钥侧，无需私钥）
 *
 * 核心原理（BIP-32 公钥侧派生）:
 *   普通 HD:  child_privkey = parent_privkey + HMAC(parent_pubkey, chaincode, index)
 *   公钥侧:  child_pubkey  = parent_pubkey + HMAC(parent_pubkey, chaincode, index) · G
 *
 * 后者完全不需要私钥参与！
 *
 * 对 MPC 的意义:
 *   - MPC 生成的公钥 P（及链码 chaincode）对外公开
 *   - 服务端可以无限派生子地址，不需要触发任何 MPC 协议
 *   - 只有花费某个子地址的资金时，才需要 MPC 各方协作签名
 *   - 签名时各方对自己的主密钥分片做同样的派生得到子分片
 *
 * 注意: 本实现简化了 BIP-32 的链码管理，聚焦展示核心派生逻辑。
 */

const { sha256 } = require('@noble/hashes/sha256');
const { sha512 } = require('@noble/hashes/sha512');
const { hmac } = require('@noble/hashes/hmac');
const { keccak_256 } = require('@noble/hashes/sha3');

const {
  N, mod,
  pointFromBytes, pointToBytes, pointMul, pubKeyToAddress,
  bytesToBigInt, bigIntToBytes32,
} = require('./field');

// BIP-32 hardened 偏移量
const HARDENED_OFFSET = 0x80000000; // 2^31

// ─── BIP-44 路径解析 ──────────────────────────────────────────────

/**
 * 解析 BIP-44 路径字符串为索引数组
 *
 * 支持格式:
 *   - "m/44'/60'/0'/0/0"
 *   - "m/44/60/0/0/0"
 *   - [44, 60, 0, 0, 0]
 *   - [2147483692, 2147483708, 2147483648, 0, 0] (hardened 数值)
 *
 * @param {string|number[]} path - BIP-44 路径
 * @returns {{ indices: number[], isHardened: boolean[] }}
 */
function parseBIP44Path(path) {
  if (Array.isArray(path)) {
    const isHardened = path.map(i => i >= HARDENED_OFFSET);
    const indices = path.map(i => (i >= HARDENED_OFFSET ? i - HARDENED_OFFSET : i));
    return { indices, isHardened };
  }

  if (typeof path !== 'string') {
    throw new Error('Path must be a string or array of numbers');
  }

  const parts = path.trim().split('/');
  if (parts[0] !== 'm') {
    throw new Error('BIP-44 path must start with "m/"');
  }

  const indices = [];
  const isHardened = [];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const hardened = part.endsWith("'") || part.endsWith('h') || part.endsWith('H');
    const numStr = hardened ? part.slice(0, -1) : part;
    const num = parseInt(numStr, 10);

    if (!Number.isFinite(num) || num < 0 || num >= HARDENED_OFFSET) {
      throw new Error(`Invalid path index: ${part}`);
    }

    indices.push(num);
    isHardened.push(hardened);
  }

  return { indices, isHardened };
}

// ─── 链码生成 ──────────────────────────────────────────────────────

/**
 * 从主公钥生成根链码（标准 BIP-32 HMAC-SHA512）
 *
 * 标准 BIP-32: I = HMAC-SHA512(key="Bitcoin seed", data=seed)
 *              IL = I[0:32]（主私钥）, IR = I[32:64]（主链码）
 *
 * MPC 场景下无统一 seed，以主公钥作为输入数据，
 * 取 HMAC-SHA512 输出的右 256 bits 作为根链码。
 *
 * @param {Buffer} publicKeyBytes - 压缩主公钥（33 bytes）
 * @returns {Buffer} 32 bytes 链码
 */
function deriveRootChainCode(publicKeyBytes) {
  const I = hmac(sha512, Buffer.from('Bitcoin seed'), publicKeyBytes);
  return Buffer.from(I.slice(32, 64));
}

// ─── BIP-32 公钥侧子密钥派生 ──────────────────────────────────────

/**
 * 从父公钥派生子公钥（公钥侧 BIP-32，non-hardened 路径）
 *
 * BIP-32 公钥派生:
 *   I = HMAC-SHA512(key=chaincode, data=pubkey || index)
 *   IL = I[:32]（左 32 bytes，用于密钥调整）
 *   IR = I[32:]（右 32 bytes，子链码）
 *   child_pubkey = parent_pubkey + IL · G
 *
 * @param {Buffer} parentPubKey   - 父公钥（压缩，33 bytes）
 * @param {Buffer} chainCode      - 父链码（32 bytes）
 * @param {number} index          - 子索引（0 到 2^31-1，non-hardened）
 * @returns {{ childPubKey: Buffer, childChainCode: Buffer, tweak: bigint }}
 */
function deriveChildPublicKey(parentPubKey, chainCode, index) {
  // 构造 HMAC 数据: 压缩公钥 || index（4 bytes big-endian）
  const indexBuf = Buffer.alloc(4);
  indexBuf.writeUInt32BE(index, 0);
  const data = Buffer.concat([parentPubKey, indexBuf]);

  // HMAC-SHA512（此处用两次 SHA256 模拟，生产中用 @noble/hashes/sha512 的 hmac）
  // 左半部分作为 tweak，右半部分作为子链码
  const hmacLeft = hmac(sha256, chainCode, Buffer.concat([data, Buffer.from([0])]));
  const hmacRight = hmac(sha256, chainCode, Buffer.concat([data, Buffer.from([1])]));

  const IL = Buffer.from(hmacLeft);    // 32 bytes，密钥调整量
  const childChainCode = Buffer.from(hmacRight); // 32 bytes，子链码

  // tweak = IL 作为标量
  const tweak = bytesToBigInt(IL) % N;

  // child_pubkey = parent_pubkey + tweak · G
  const parentPoint = pointFromBytes(parentPubKey);
  const tweakPoint = pointMul(tweak);
  const childPoint = parentPoint.add(tweakPoint);

  return {
    childPubKey: pointToBytes(childPoint),
    childChainCode,
    tweak, // 签名时，各方在自己的私钥分片上加上这个 tweak
  };
}

/**
 * 从主公钥按路径派生子公钥（支持 BIP-44 路径字符串和数组）
 *
 * MPC 公钥侧限制：遇到 hardened 派生时会抛出错误。
 * 标准用法：将 MPC 主公钥设为 account 层（如 m/44'/60'/0'），
 * 公钥侧只派生最后两层 change / address_index。
 *
 * @param {Buffer} masterPubKey - MPC 生成的主公钥
 * @param {Buffer} masterChainCode - 根链码
 * @param {string|number[]} path - 路径（如 "m/0/42" 或 [0, 42]）
 * @returns {{ pubKey: Buffer, chainCode: Buffer, address: string, tweaks: bigint[], path: string }}
 */
function derivePathPublicKey(masterPubKey, masterChainCode, path) {
  const { indices, isHardened } = parseBIP44Path(path);

  let pubKey = masterPubKey;
  let chainCode = masterChainCode;
  const tweaks = [];

  for (let i = 0; i < indices.length; i++) {
    if (isHardened[i]) {
      throw new Error(
        `Hardened derivation at index ${indices[i]}' requires private key. ` +
        `In MPC, perform hardened levels before DKG or use pre-derived account keys.`
      );
    }

    const { childPubKey, childChainCode, tweak } = deriveChildPublicKey(
      pubKey, chainCode, indices[i]
    );
    pubKey = childPubKey;
    chainCode = childChainCode;
    tweaks.push(tweak);
  }

  const point = pointFromBytes(pubKey);
  const address = pubKeyToAddress(point);
  const pathStr = 'm/' + indices.map((n, i) => n + (isHardened[i] ? "'" : '')).join('/');

  return { pubKey, chainCode, address, tweaks, path: pathStr };
}

// ─── BIP-44 标准地址派生 ──────────────────────────────────────────

/**
 * 按 BIP-44 标准派生单个地址（从 account 层开始，公钥侧）
 *
 * 标准路径: m/44'/60'/0'/0/{index}  (ETH)
 *          m/44'/0'/0'/0/{index}     (BTC)
 *
 * MPC 实现中，account 层之前的 hardened 派生由各方在 DKG 前完成，
 * MPC 主公钥即为 m/44'/60'/0' 层级的公钥。
 *
 * @param {Buffer} accountPubKey - account 层公钥（如 m/44'/60'/0'）
 * @param {Buffer} accountChainCode - account 层链码
 * @param {number} addressIndex - 地址索引
 * @param {number} change - change 层（0 = 外部/收款，1 = 内部/找零，默认 0）
 * @param {number} coinType - BIP-44 coin type（ETH=60, BTC=0, 默认 60）
 * @param {number} account - account 索引（默认 0）
 * @returns {{ pubKey: Buffer, chainCode: Buffer, address: string, tweaks: bigint[], path: string }}
 */
function deriveBIP44Address(accountPubKey, accountChainCode, addressIndex, change = 0, coinType = 60, account = 0) {
  // 公钥侧只做最后两层的 non-hardened 派生
  const { pubKey, chainCode, address, tweaks } = derivePathPublicKey(
    accountPubKey, accountChainCode, [change, addressIndex]
  );

  // 返回完整 BIP-44 路径（hardened 层已在前置步骤完成）
  const path = `m/44'/${coinType}'/${account}'/${change}/${addressIndex}`;

  return { pubKey, chainCode, address, tweaks, path };
}

/**
 * 批量派生 BIP-44 地址（从 account 层开始）
 *
 * @param {Buffer} accountPubKey - account 层公钥
 * @param {Buffer} accountChainCode - account 层链码
 * @param {number} count - 派生数量
 * @param {number} startIndex - 起始索引（默认 0）
 * @param {number} change - change 层（默认 0）
 * @param {number} coinType - BIP-44 coin type（默认 60）
 * @param {number} account - account 索引（默认 0）
 * @returns {Array<{ index: number, path: string, address: string, pubKey: string }>}
 */
function deriveBIP44Addresses(accountPubKey, accountChainCode, count, startIndex = 0, change = 0, coinType = 60, account = 0) {
  const addresses = [];

  for (let i = startIndex; i < startIndex + count; i++) {
    const { pubKey, address, tweaks, path } = deriveBIP44Address(
      accountPubKey, accountChainCode, i, change, coinType, account
    );

    addresses.push({
      index: i,
      path,
      address,
      pubKey: Buffer.from(pubKey).toString('hex'),
      tweaks: tweaks.map(t => t.toString(16)),
    });
  }

  return addresses;
}

// ─── 签名时派生子私钥分片（各方本地执行）─────────────────────────

/**
 * 将累计 tweak 应用到私钥分片上
 * 当需要对某个子地址签名时，各方用此函数调整自己的分片
 *
 * child_keyShare_i = keyShare_i + Σ tweaks（所有路径层的 tweak 之和）
 *
 * 这是公钥侧派生正确性的保证：
 *   Σᵢ λᵢ · child_keyShare_i = F(0) + tweak = 子私钥
 *   child_pubkey = (F(0) + tweak) · G = F(0)·G + tweak·G = 主公钥 + tweak·G ✓
 *
 * @param {bigint} keyShare  - 主密钥分片
 * @param {bigint[]} tweaks  - 路径上各层的 tweak 标量
 * @returns {bigint} 子密钥分片
 */
function applyTweaksToKeyShare(keyShare, tweaks) {
  let adjusted = keyShare;
  for (const tweak of tweaks) {
    adjusted = (adjusted + tweak) % N;
  }
  return adjusted;
}

// ─── 商户收款地址批量派生 ──────────────────────────────────────────

/**
 * 为商户批量派生收款地址（BIP-44 兼容，模拟每单独立地址）
 * 路径约定: m/44'/60'/0'/0/{orderId}（ETH，从 MPC 主公钥作为 account 层出发）
 *
 * @param {Buffer} masterPubKey - MPC 主公钥（视为 BIP-44 account 层）
 * @param {Buffer} masterChainCode
 * @param {number} count - 派生地址数量
 * @param {number} startIndex - 起始索引（默认 0）
 * @param {number} coinType - BIP-44 coin type（ETH=60, 默认 60）
 * @returns {Array<{ index: number, path: string, address: string, pubKey: string }>}
 */
function deriveReceivingAddresses(masterPubKey, masterChainCode, count, startIndex = 0, coinType = 60) {
  const addresses = [];

  // 先派生到 change 层 m/0（固定的外部/收款层）
  const { childPubKey: changePubKey, childChainCode: changeChainCode } =
    deriveChildPublicKey(masterPubKey, masterChainCode, 0);

  for (let i = startIndex; i < startIndex + count; i++) {
    const { pubKey, address, tweaks } = derivePathPublicKey(
      changePubKey,
      changeChainCode,
      [i]
    );

    addresses.push({
      index: i,
      path: `m/44'/${coinType}'/0'/0/${i}`,
      address,
      pubKey: Buffer.from(pubKey).toString('hex'),
      tweaks: tweaks.map(t => t.toString(16)), // 签名时需要
    });
  }

  return addresses;
}

// ─── Base58 编解码（xpub 序列化需要）────────────────────────────────

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buf) {
  const digits = [0];
  for (let i = 0; i < buf.length; i++) {
    let carry = buf[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  // 前导 0x00 -> '1'
  let str = '';
  for (let i = 0; i < buf.length && buf[i] === 0; i++) str += '1';
  for (let i = digits.length - 1; i >= 0; i--) str += BASE58_ALPHABET[digits[i]];
  return str;
}

function base58Decode(str) {
  const digits = [0];
  for (let i = 0; i < str.length; i++) {
    const char = BASE58_ALPHABET.indexOf(str[i]);
    if (char < 0) throw new Error('Invalid Base58 character');
    let carry = char;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 58;
      digits[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry) {
      digits.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // 前导 '1' -> 0x00
  let leadingZeros = 0;
  for (let i = 0; i < str.length && str[i] === '1'; i++) leadingZeros++;
  const buf = Buffer.alloc(leadingZeros + digits.length);
  for (let i = 0; i < digits.length; i++) buf[buf.length - 1 - i] = digits[i];
  return buf;
}

// ─── xpub / xprv 编解码 ────────────────────────────────────────────

// BIP-32 mainnet xpub 版本号
const XPUB_VERSION = Buffer.from([0x04, 0x88, 0xb2, 0x1e]);
const XPUB_VERSION_INT = 0x0488b21e;

/**
 * 将公钥 + 链码编码为标准 xpub 格式（Base58Check）
 *
 * @param {Buffer} publicKey - 压缩公钥（33 bytes）
 * @param {Buffer} chainCode - 链码（32 bytes）
 * @param {Object} options
 * @param {number} options.depth - 深度（默认 0，根）
 * @param {number} options.parentFingerprint - 父指纹（默认 0）
 * @param {number} options.childIndex - 子索引（默认 0）
 * @returns {string} xpub 字符串，如 "xpub6B..."
 */
function encodeXPUB(publicKey, chainCode, options = {}) {
  const depth = options.depth ?? 0;
  const parentFingerprint = options.parentFingerprint ?? 0;
  const childIndex = options.childIndex ?? 0;

  const payload = Buffer.concat([
    XPUB_VERSION,                          // 4 bytes version
    Buffer.from([depth]),                  // 1 byte depth
    Buffer.alloc(4),                       // 4 bytes parent fingerprint
    Buffer.alloc(4),                       // 4 bytes child index
    chainCode,                             // 32 bytes chain code
    publicKey,                             // 33 bytes public key
  ]);

  // 填充 parent fingerprint (big-endian)
  payload.writeUInt32BE(parentFingerprint, 5);
  // 填充 child index (big-endian)
  payload.writeUInt32BE(childIndex, 9);

  // Double-SHA256 checksum（取前 4 bytes）
  const hash1 = sha256(payload);
  const hash2 = sha256(hash1);
  const checksum = Buffer.from(hash2.slice(0, 4));

  return base58Encode(Buffer.concat([payload, checksum]));
}

/**
 * 解码 xpub 字符串，提取公钥和链码等信息
 *
 * @param {string} xpubStr - xpub 字符串
 * @returns {{ version: number, depth: number, parentFingerprint: number, childIndex: number, chainCode: Buffer, publicKey: Buffer }}
 */
function decodeXPUB(xpubStr) {
  const data = base58Decode(xpubStr);
  if (data.length !== 82) {
    throw new Error(`Invalid xpub length: ${data.length}, expected 82`);
  }

  const payload = Buffer.from(data.subarray(0, 78));
  const checksum = Buffer.from(data.subarray(78, 82));

  // 校验 checksum
  const hash1 = sha256(payload);
  const hash2 = sha256(hash1);
  const expectedChecksum = Buffer.from(hash2.slice(0, 4));
  if (!checksum.equals(expectedChecksum)) {
    throw new Error('xpub checksum mismatch');
  }

  const version = data.readUInt32BE(0);
  if (version !== XPUB_VERSION_INT) {
    throw new Error(`Unsupported xpub version: 0x${version.toString(16)}`);
  }

  return {
    version,
    depth: data[4],
    parentFingerprint: data.readUInt32BE(5),
    childIndex: data.readUInt32BE(9),
    chainCode: Buffer.from(data.subarray(13, 45)),
    publicKey: Buffer.from(data.subarray(45, 78)),
  };
}

module.exports = {
  HARDENED_OFFSET,
  parseBIP44Path,
  deriveRootChainCode,
  deriveChildPublicKey,
  derivePathPublicKey,
  applyTweaksToKeyShare,
  deriveReceivingAddresses,
  deriveBIP44Address,
  deriveBIP44Addresses,
  encodeXPUB,
  decodeXPUB,
};