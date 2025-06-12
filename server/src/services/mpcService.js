/**
 * MPC (Multi-Party Computation) Service
 * 实现多方计算协议，包括密钥生成、门限签名等功能
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

class MPCService extends EventEmitter {
  constructor() {
    super();
    this.activeSessions = new Map();
    this.participants = new Map();
    this.keyShares = new Map();
  }

  /**
   * 启动MPC密钥生成会话
   */
  async startKeyGeneration(config) {
    try {
      const sessionId = this.generateSessionId();
      
      const session = {
        id: sessionId,
        type: 'keygen',
        status: 'active',
        threshold: config.threshold,
        totalParties: config.parties,
        currentRound: 1,
        maxRounds: 3,
        participants: new Map(),
        shares: new Map(),
        publicKey: null,
        walletAddress: null,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      this.activeSessions.set(sessionId, session);

      // 模拟密钥生成过程
      const keyGenResult = await this.simulateKeyGeneration(session);
      
      return {
        success: true,
        sessionId,
        ...keyGenResult
      };
    } catch (error) {
      console.error('MPC密钥生成失败:', error);
      throw error;
    }
  }

  /**
   * 加入MPC密钥生成会话
   */
  async joinKeyGeneration({ sessionId, participantId }) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在或已过期');
      }

      if (session.type !== 'keygen') {
        throw new Error('无效的会话类型');
      }

      if (session.status !== 'active') {
        throw new Error('会话已完成或不可用');
      }

      // 添加参与者
      if (!session.participants.has(participantId)) {
        session.participants.set(participantId, {
          id: participantId,
          joinedAt: new Date(),
          rounds: new Map()
        });
      }

      // 检查是否还有空位
      if (session.participants.size > session.totalParties) {
        throw new Error('会话参与者已满');
      }

      // 如果会话已完成，直接返回结果
      if (session.status === 'completed' && session.publicKey) {
        return {
          success: true,
          sessionId,
          keyShares: Array.from(session.shares.values()),
          publicKey: session.publicKey,
          address: session.walletAddress,
          threshold: session.threshold,
          totalParties: session.totalParties,
          status: 'completed'
        };
      }

      // 如果会话还在进行中但所有参与者都已加入，尝试完成密钥生成
      if (session.participants.size >= session.totalParties && session.status === 'active') {
        const keyGenResult = await this.simulateKeyGeneration(session);
        return {
          success: true,
          sessionId,
          ...keyGenResult
        };
      }

      return {
        success: true,
        sessionId,
        status: 'joined',
        currentRound: session.currentRound,
        totalParties: session.totalParties,
        threshold: session.threshold,
        participantCount: session.participants.size
      };
    } catch (error) {
      console.error('加入MPC密钥生成失败:', error);
      throw error;
    }
  }

  /**
   * 启动MPC签名会话
   */
  async startSigning(transactionData, walletConfig) {
    try {
      const sessionId = this.generateSessionId();
      
      const session = {
        id: sessionId,
        type: 'signing',
        status: 'active',
        threshold: walletConfig.threshold,
        totalParties: walletConfig.parties,
        currentRound: 1,
        maxRounds: 2,
        participants: new Map(),
        signatures: new Map(),
        transactionData,
        finalSignature: null,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      this.activeSessions.set(sessionId, session);

      // 模拟签名过程
      const signingResult = await this.simulateSigning(session);
      
      return {
        success: true,
        sessionId,
        ...signingResult
      };
    } catch (error) {
      console.error('MPC签名失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话状态
   */
  getSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    return {
      sessionId: session.id,
      type: session.type,
      status: session.status,
      currentRound: session.currentRound,
      maxRounds: session.maxRounds,
      participantCount: session.participants.size,
      totalParties: session.totalParties,
      progress: (session.currentRound / session.maxRounds) * 100
    };
  }

  /**
   * 添加参与方数据
   */
  async addParticipantData(sessionId, participantId, roundData) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    // 更新参与方数据
    if (!session.participants.has(participantId)) {
      session.participants.set(participantId, {
        id: participantId,
        joinedAt: new Date(),
        rounds: new Map()
      });
    }

    const participant = session.participants.get(participantId);
    participant.rounds.set(session.currentRound, roundData);
    session.lastActivity = new Date();

    // 检查是否所有参与方都提交了当前轮次的数据
    const requiredParticipants = session.type === 'keygen' ? session.totalParties : session.threshold;
    if (session.participants.size >= requiredParticipants) {
      await this.processRound(session);
    }

    return this.getSessionStatus(sessionId);
  }

  /**
   * 模拟密钥生成过程
   */
  async simulateKeyGeneration(session) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 生成模拟的密钥分片
        const keyShares = [];
        for (let i = 0; i < session.totalParties; i++) {
          keyShares.push({
            participantId: `participant_${i + 1}`,
            share: crypto.randomBytes(32).toString('hex'),
            publicData: crypto.randomBytes(64).toString('hex')
          });
        }

        // 生成公钥和地址
        const publicKey = '0x04' + crypto.randomBytes(64).toString('hex');
        const address = '0x' + crypto.randomBytes(20).toString('hex');

        session.shares = new Map(keyShares.map(share => [share.participantId, share]));
        session.publicKey = publicKey;
        session.walletAddress = address;
        session.status = 'completed';

        this.keyShares.set(session.id, keyShares);

        resolve({
          keyShares,
          publicKey,
          address,
          threshold: session.threshold,
          totalParties: session.totalParties
        });
      }, 2000);
    });
  }

  /**
   * 模拟签名过程
   */
  async simulateSigning(session) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 生成模拟的签名分片
        const signatures = [];
        for (let i = 0; i < session.threshold; i++) {
          signatures.push({
            participantId: `participant_${i + 1}`,
            signature: crypto.randomBytes(65).toString('hex'),
            r: crypto.randomBytes(32).toString('hex'),
            s: crypto.randomBytes(32).toString('hex'),
            v: 27 + (i % 2)
          });
        }

        // 聚合签名
        const finalSignature = {
          r: crypto.randomBytes(32).toString('hex'),
          s: crypto.randomBytes(32).toString('hex'),
          v: 27,
          signature: '0x' + crypto.randomBytes(65).toString('hex')
        };

        session.signatures = new Map(signatures.map(sig => [sig.participantId, sig]));
        session.finalSignature = finalSignature;
        session.status = 'completed';

        resolve({
          signatures,
          finalSignature,
          transactionHash: '0x' + crypto.randomBytes(32).toString('hex')
        });
      }, 1500);
    });
  }

  /**
   * 处理当前轮次
   */
  async processRound(session) {
    session.currentRound += 1;
    
    if (session.currentRound > session.maxRounds) {
      session.status = 'completed';
      this.emit('sessionCompleted', session.id);
    } else {
      this.emit('roundCompleted', session.id, session.currentRound - 1);
    }
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return 'mpc_' + crypto.randomBytes(16).toString('hex');
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions() {
    const now = new Date();
    const expirationTime = 30 * 60 * 1000; // 30分钟

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > expirationTime) {
        this.activeSessions.delete(sessionId);
        console.log(`清理过期会话: ${sessionId}`);
      }
    }
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values()).map(session => ({
      id: session.id,
      type: session.type,
      status: session.status,
      participantCount: session.participants.size,
      totalParties: session.totalParties,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }));
  }
}

// 创建单例实例
const mpcService = new MPCService();

// 定期清理过期会话
setInterval(() => {
  mpcService.cleanupExpiredSessions();
}, 5 * 60 * 1000); // 每5分钟清理一次

module.exports = mpcService;