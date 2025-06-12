const { ethers } = require('ethers');

/**
 * 钱包创建验证
 */
const validateWalletCreation = (req, res, next) => {
  const { participantCount, threshold, userId } = req.body;

  // 验证必需字段
  if (!participantCount || !threshold || !userId) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: participantCount, threshold, userId'
    });
  }

  // 验证参与方数量
  if (!Number.isInteger(participantCount) || participantCount < 2 || participantCount > 10) {
    return res.status(400).json({
      success: false,
      error: '参与方数量必须是 2-10 之间的整数'
    });
  }

  // 验证阈值
  if (!Number.isInteger(threshold) || threshold < 2 || threshold > participantCount) {
    return res.status(400).json({
      success: false,
      error: '阈值必须是 2 到参与方数量之间的整数'
    });
  }

  // 验证用户ID
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: '用户ID不能为空'
    });
  }

  next();
};

/**
 * 钱包导入验证
 */
const validateWalletImport = (req, res, next) => {
  const { walletData, privateKeyShare, userId } = req.body;

  // 验证必需字段
  if (!walletData || !userId) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: walletData, userId'
    });
  }

  // 验证钱包数据
  if (!walletData.address || !walletData.publicKey) {
    return res.status(400).json({
      success: false,
      error: '钱包数据必须包含 address 和 publicKey'
    });
  }

  // 验证地址格式
  if (!ethers.isAddress(walletData.address)) {
    return res.status(400).json({
      success: false,
      error: '无效的钱包地址格式'
    });
  }

  // 验证用户ID
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: '用户ID不能为空'
    });
  }

  next();
};

/**
 * 交易验证
 */
const validateTransaction = (req, res, next) => {
  const { from, to, amount, walletId } = req.body;

  // 验证必需字段
  if (!from || !to || amount === undefined || !walletId) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: from, to, amount, walletId'
    });
  }

  // 验证地址格式
  if (!ethers.isAddress(from)) {
    return res.status(400).json({
      success: false,
      error: '无效的发送地址格式'
    });
  }

  if (!ethers.isAddress(to)) {
    return res.status(400).json({
      success: false,
      error: '无效的接收地址格式'
    });
  }

  // 验证金额
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: '金额必须是大于0的数字'
    });
  }

  // 验证钱包ID
  if (typeof walletId !== 'string' || walletId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: '钱包ID不能为空'
    });
  }

  // 验证可选的 Gas 参数
  if (req.body.gasLimit && (!Number.isInteger(req.body.gasLimit) || req.body.gasLimit <= 0)) {
    return res.status(400).json({
      success: false,
      error: 'Gas 限制必须是正整数'
    });
  }

  if (req.body.gasPrice && (typeof req.body.gasPrice !== 'string' && typeof req.body.gasPrice !== 'number')) {
    return res.status(400).json({
      success: false,
      error: 'Gas 价格格式无效'
    });
  }

  next();
};

/**
 * MPC 密钥生成验证
 */
const validateMPCKeygen = (req, res, next) => {
  const { parties, threshold } = req.body;

  // 验证必需字段
  if (!parties || !threshold) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: parties, threshold'
    });
  }

  // 验证参与方数量
  if (!Number.isInteger(parties) || parties < 2 || parties > 10) {
    return res.status(400).json({
      success: false,
      error: '参与方数量必须是 2-10 之间的整数'
    });
  }

  // 验证阈值
  if (!Number.isInteger(threshold) || threshold < 2 || threshold > parties) {
    return res.status(400).json({
      success: false,
      error: '阈值必须是 2 到参与方数量之间的整数'
    });
  }

  next();
};

/**
 * MPC 签名验证
 */
const validateMPCSign = (req, res, next) => {
  const { transactionData, walletConfig } = req.body;

  // 验证必需字段
  if (!transactionData || !walletConfig) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: transactionData, walletConfig'
    });
  }

  // 验证交易数据
  if (typeof transactionData !== 'object') {
    return res.status(400).json({
      success: false,
      error: '交易数据必须是对象'
    });
  }

  // 验证接收地址
  if (!transactionData.to || !ethers.isAddress(transactionData.to)) {
    return res.status(400).json({
      success: false,
      error: '无效的接收地址'
    });
  }

  // 验证钱包配置
  if (typeof walletConfig !== 'object') {
    return res.status(400).json({
      success: false,
      error: '钱包配置必须是对象'
    });
  }

  // 验证阈值
  if (!Number.isInteger(walletConfig.threshold) || walletConfig.threshold < 2) {
    return res.status(400).json({
      success: false,
      error: '阈值必须是大于等于2的整数'
    });
  }

  // 验证参与方数量
  if (!Number.isInteger(walletConfig.parties) || walletConfig.parties < walletConfig.threshold) {
    return res.status(400).json({
      success: false,
      error: '参与方数量必须大于等于阈值'
    });
  }

  next();
};

/**
 * 以太坊地址验证
 */
const validateEthereumAddress = (address) => {
  if (typeof address !== 'string') {
    return { valid: false, error: '地址必须是字符串' };
  }

  if (!ethers.isAddress(address)) {
    return { valid: false, error: '无效的以太坊地址格式' };
  }

  return { valid: true };
};

/**
 * 金额验证
 */
const validateAmount = (amount) => {
  if (typeof amount !== 'number' && typeof amount !== 'string') {
    return { valid: false, error: '金额必须是数字或数字字符串' };
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: '金额必须是大于0的数字' };
  }

  if (numAmount > 1000000) {
    return { valid: false, error: '金额过大' };
  }

  return { valid: true, amount: numAmount };
};

/**
 * 私钥验证
 */
const validatePrivateKey = (privateKey) => {
  if (typeof privateKey !== 'string') {
    return { valid: false, error: '私钥必须是字符串' };
  }

  // 检查是否是有效的十六进制字符串
  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    return { valid: false, error: '私钥格式无效，应为 64 位十六进制字符串' };
  }

  return { valid: true };
};

/**
 * 签名验证
 */
const validateSignature = (signature) => {
  if (!signature || typeof signature !== 'object') {
    return { valid: false, error: '签名必须是对象' };
  }

  const { r, s, v } = signature;

  // 验证 r 和 s
  if (!r || !s || !/^0x[a-fA-F0-9]{64}$/.test(r) || !/^0x[a-fA-F0-9]{64}$/.test(s)) {
    return { valid: false, error: '签名的 r 和 s 必须是 64 位十六进制字符串' };
  }

  // 验证 v
  if (typeof v !== 'number' || (v !== 27 && v !== 28)) {
    return { valid: false, error: '签名的 v 必须是 27 或 28' };
  }

  return { valid: true };
};

/**
 * 通用字符串验证
 */
const validateString = (value, fieldName, minLength = 1, maxLength = 255) => {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName}必须是字符串` };
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName}长度不能少于${minLength}个字符` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName}长度不能超过${maxLength}个字符` };
  }

  return { valid: true, value: trimmed };
};

/**
 * UUID 验证
 */
const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (typeof uuid !== 'string' || !uuidRegex.test(uuid)) {
    return { valid: false, error: '无效的UUID格式' };
  }

  return { valid: true };
};

/**
 * 分页参数验证
 */
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;

  if (pageNum < 1) {
    return { valid: false, error: '页码必须大于0' };
  }

  if (limitNum < 1 || limitNum > 100) {
    return { valid: false, error: '每页数量必须在1-100之间' };
  }

  return { valid: true, page: pageNum, limit: limitNum };
};

module.exports = {
  validateWalletCreation,
  validateWalletImport,
  validateTransaction,
  validateMPCKeygen,
  validateMPCSign,
  validateEthereumAddress,
  validateAmount,
  validatePrivateKey,
  validateSignature,
  validateString,
  validateUUID,
  validatePagination
};