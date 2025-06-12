const express = require('express');
const router = express.Router();
const walletService = require('../services/walletService');
const { validateWalletCreation, validateWalletImport } = require('../utils/validation');

// 创建新钱包
router.post('/create', validateWalletCreation, async (req, res) => {
  try {
    const { participantCount, threshold, userId } = req.body;
    
    const result = await walletService.createWallet({
      participantCount,
      threshold,
      userId
    });
    
    res.json({
      success: true,
      data: result,
      message: '钱包创建成功'
    });
  } catch (error) {
    console.error('创建钱包失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 导入钱包
router.post('/import', validateWalletImport, async (req, res) => {
  try {
    const { walletData, privateKeyShare, userId } = req.body;
    
    const result = await walletService.importWallet({
      walletData,
      privateKeyShare,
      userId
    });
    
    res.json({
      success: true,
      data: result,
      message: '钱包导入成功'
    });
  } catch (error) {
    console.error('导入钱包失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取钱包列表
router.get('/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const wallets = await walletService.getWalletsByUser(userId);
    
    res.json({
      success: true,
      data: wallets
    });
  } catch (error) {
    console.error('获取钱包列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取钱包详情
router.get('/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    
    const wallet = await walletService.getWalletById(walletId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: '钱包不存在'
      });
    }
    
    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('获取钱包详情失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取钱包余额
router.get('/:walletId/balance', async (req, res) => {
  try {
    const { walletId } = req.params;
    
    const balance = await walletService.getWalletBalance(walletId);
    
    res.json({
      success: true,
      data: {
        balance: balance.toString(),
        formatted: balance.toFixed(4) + ' ETH'
      }
    });
  } catch (error) {
    console.error('获取钱包余额失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除钱包
router.delete('/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { userId } = req.body;
    
    await walletService.deleteWallet(walletId, userId);
    
    res.json({
      success: true,
      message: '钱包删除成功'
    });
  } catch (error) {
    console.error('删除钱包失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;