const express = require('express');
const router = express.Router();
const mpcService = require('../services/mpcService');
const { validateMPCKeygen, validateMPCSign } = require('../utils/validation');

// 启动 MPC 密钥生成
router.post('/keygen/start', validateMPCKeygen, async (req, res) => {
  try {
    const { parties, threshold } = req.body;
    
    const result = await mpcService.startKeyGeneration({
      parties,
      threshold
    });
    
    res.json({
      success: true,
      data: result,
      message: 'MPC 密钥生成启动成功'
    });
  } catch (error) {
    console.error('MPC 密钥生成启动失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 加入 MPC 密钥生成
router.post('/keygen/join', async (req, res) => {
  try {
    const { sessionId, participantId } = req.body;
    
    // 验证必需字段
    if (!sessionId || !participantId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: sessionId, participantId'
      });
    }
    
    const result = await mpcService.joinKeyGeneration({
      sessionId,
      participantId
    });
    
    res.json({
      success: true,
      data: result,
      message: 'MPC 密钥生成加入成功'
    });
  } catch (error) {
    console.error('MPC 密钥生成加入失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 启动 MPC 签名
router.post('/sign/start', validateMPCSign, async (req, res) => {
  try {
    const { transactionData, walletConfig } = req.body;
    
    const result = await mpcService.startSigning(transactionData, walletConfig);
    
    res.json({
      success: true,
      data: result,
      message: 'MPC 签名启动成功'
    });
  } catch (error) {
    console.error('MPC 签名启动失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取 MPC 会话状态
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await mpcService.getSessionStatus(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'MPC 会话不存在'
      });
    }
    
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('获取 MPC 会话状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 添加参与方数据
router.post('/session/:sessionId/participant', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participantId, roundData } = req.body;
    
    const result = await mpcService.addParticipantData(sessionId, participantId, roundData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('添加参与方数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取所有活跃会话
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await mpcService.getActiveSessions();
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('获取活跃会话失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 提交参与方交互数据
router.post('/session/:sessionId/data', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participantId, round, data } = req.body;
    
    await mpcService.submitParticipantData(sessionId, participantId, round, data);
    
    res.json({
      success: true,
      message: '交互数据提交成功'
    });
  } catch (error) {
    console.error('提交参与方交互数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;