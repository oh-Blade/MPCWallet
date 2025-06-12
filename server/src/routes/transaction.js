const express = require('express');
const router = express.Router();
const transactionService = require('../services/transactionService');
const { validateTransaction } = require('../utils/validation');

// 创建交易
router.post('/create', validateTransaction, async (req, res) => {
  try {
    const { from, to, amount, gasLimit, gasPrice, data, walletId } = req.body;
    
    const transaction = await transactionService.createTransaction({
      from,
      to,
      amount,
      gasLimit,
      gasPrice,
      data,
      walletId
    });
    
    res.json({
      success: true,
      data: transaction,
      message: '交易创建成功'
    });
  } catch (error) {
    console.error('创建交易失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 估算 Gas 费用
router.post('/estimate-gas', async (req, res) => {
  try {
    const { from, to, amount, data } = req.body;
    
    const gasEstimate = await transactionService.estimateGas({
      from,
      to,
      amount,
      data
    });
    
    res.json({
      success: true,
      data: gasEstimate
    });
  } catch (error) {
    console.error('估算 Gas 费用失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取当前 Gas 价格
router.get('/gas-price', async (req, res) => {
  try {
    const gasPrice = await transactionService.getCurrentGasPrice();
    
    res.json({
      success: true,
      data: {
        gasPrice: gasPrice.toString(),
        gasPriceGwei: gasPrice.toFixed(2) + ' Gwei'
      }
    });
  } catch (error) {
    console.error('获取 Gas 价格失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 广播已签名的交易
router.post('/broadcast', async (req, res) => {
  try {
    const { signedTransaction } = req.body;
    
    const txHash = await transactionService.broadcastTransaction(signedTransaction);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash
      },
      message: '交易广播成功'
    });
  } catch (error) {
    console.error('广播交易失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取交易状态
router.get('/status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    const status = await transactionService.getTransactionStatus(txHash);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('获取交易状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取交易历史
router.get('/history/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const history = await transactionService.getTransactionHistory(
      address, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('获取交易历史失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取交易详情
router.get('/detail/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    const transaction = await transactionService.getTransactionDetail(txHash);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: '交易不存在'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('获取交易详情失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 取消交易（通过发送更高 Gas 价格的相同 nonce 交易）
router.post('/cancel', async (req, res) => {
  try {
    const { originalTxHash, newGasPrice, walletId } = req.body;
    
    const cancelTx = await transactionService.cancelTransaction({
      originalTxHash,
      newGasPrice,
      walletId
    });
    
    res.json({
      success: true,
      data: cancelTx,
      message: '交易取消请求已提交'
    });
  } catch (error) {
    console.error('取消交易失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 加速交易（通过发送更高 Gas 价格的相同交易）
router.post('/speed-up', async (req, res) => {
  try {
    const { originalTxHash, newGasPrice } = req.body;
    
    const speedUpTx = await transactionService.speedUpTransaction({
      originalTxHash,
      newGasPrice
    });
    
    res.json({
      success: true,
      data: speedUpTx,
      message: '交易加速请求已提交'
    });
  } catch (error) {
    console.error('加速交易失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;