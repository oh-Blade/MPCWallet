const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');

// 获取网络信息
router.get('/network-info', async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    
    res.json({
      success: true,
      data: networkInfo
    });
  } catch (error) {
    console.error('获取网络信息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取最新区块
router.get('/latest-block', async (req, res) => {
  try {
    const block = await blockchainService.getLatestBlock();
    
    res.json({
      success: true,
      data: block
    });
  } catch (error) {
    console.error('获取最新区块失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取账户余额
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await blockchainService.getBalance(address);
    
    res.json({
      success: true,
      data: {
        address,
        balance: balance.toString(),
        balanceEth: balance.toFixed(6) + ' ETH'
      }
    });
  } catch (error) {
    console.error('获取账户余额失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取 Nonce
router.get('/nonce/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const nonce = await blockchainService.getNonce(address);
    
    res.json({
      success: true,
      data: {
        address,
        nonce
      }
    });
  } catch (error) {
    console.error('获取 Nonce 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 验证地址格式
router.post('/validate-address', async (req, res) => {
  try {
    const { address } = req.body;
    const isValid = await blockchainService.validateAddress(address);
    
    res.json({
      success: true,
      data: {
        address,
        isValid
      }
    });
  } catch (error) {
    console.error('验证地址失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取 ERC-20 代币余额
router.get('/token-balance/:address/:tokenAddress', async (req, res) => {
  try {
    const { address, tokenAddress } = req.params;
    const balance = await blockchainService.getTokenBalance(address, tokenAddress);
    
    res.json({
      success: true,
      data: {
        address,
        tokenAddress,
        balance: balance.toString()
      }
    });
  } catch (error) {
    console.error('获取代币余额失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取代币信息
router.get('/token-info/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const tokenInfo = await blockchainService.getTokenInfo(tokenAddress);
    
    res.json({
      success: true,
      data: tokenInfo
    });
  } catch (error) {
    console.error('获取代币信息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取区块详情
router.get('/block/:blockNumber', async (req, res) => {
  try {
    const { blockNumber } = req.params;
    const block = await blockchainService.getBlock(blockNumber);
    
    if (!block) {
      return res.status(404).json({
        success: false,
        error: '区块不存在'
      });
    }
    
    res.json({
      success: true,
      data: block
    });
  } catch (error) {
    console.error('获取区块详情失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 搜索交易、地址或区块
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const result = await blockchainService.search(query);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;