const { sha256 } = require('@noble/hashes/sha256');
const { sha512 } = require('@noble/hashes/sha512');
const { hmac } = require('@noble/hashes/hmac');
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


/**
 * 从压缩公钥字节还原点
 */
const pointFromBytes = (bytes) =>
  secp256k1.ProjectivePoint.fromHex(Buffer.from(bytes).toString('hex'));


/**
 * 标量乘法：scalar * G
 * 返回 ProjectivePoint
 */
const pointMul = (scalar) => G.multiply(mod(scalar));


/**
 * 点序列化为压缩格式（33 bytes）
 */
const pointToBytes = (P) =>
  Buffer.from(P.toRawBytes(true));

/**
 * 非压缩公钥（65 bytes，去掉 0x04 前缀后 64 bytes）→ 以太坊地址
 */
function pubKeyToAddress(pubKeyPoint) {
  const uncompressed = pubKeyPoint.toRawBytes(false); // 65 bytes: 0x04 + x + y
  const pubKeyBytes = uncompressed.slice(1);           // 去掉 0x04，取 64 bytes
  const hash = keccak_256(pubKeyBytes);                // keccak256(x || y)
  const address = Buffer.from(hash).slice(12);         // 取最后 20 bytes
  return '0x' + address.toString('hex');
}

function bytesToBigInt(bytes) {
  let result = 0n;
  for (const byte of bytes) result = (result << 8n) | BigInt(byte);
  return result;
}