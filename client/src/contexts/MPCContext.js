import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const MPCContext = createContext();

export const useMPC = () => {
  const context = useContext(MPCContext);
  if (!context) {
    throw new Error('useMPC must be used within a MPCProvider');
  }
  return context;
};

export const MPCProvider = ({ children }) => {
  const [keyGenProgress, setKeyGenProgress] = useState(0);
  const [signingProgress, setSigningProgress] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('send'); // 'send' or 'receive'

  const startKeyGeneration = async (config) => {
    try {
      // 转换参数名以匹配后端API，确保数字类型
      const requestData = {
        parties: parseInt(config.parties),    // 转换为整数
        threshold: parseInt(config.threshold) // 转换为整数
      };
      
      const response = await axios.post('/api/mpc/keygen/start', requestData);
      const sessionId = response.data.data.sessionId;
      const responseData = response.data.data;

      // 如果已经完成（只有1个参与者的情况），直接返回结果
      if (responseData.keyShares && responseData.publicKey && responseData.address) {
        setKeyGenProgress(100);
        return {
          success: true,
          sessionId,
          keyShares: responseData.keyShares,
          publicKey: responseData.publicKey,
          address: responseData.address
        };
      }

      // 如果是等待其他参与者状态，模拟密钥生成进度
      setKeyGenProgress(0);
      const progressInterval = setInterval(() => {
        setKeyGenProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // 模拟MPC数据交换
      setTimeout(() => {
        showMPCModal(
          { sessionId, round: 1, data: 'mock_keygen_data' },
          'send'
        );
      }, 2000);

      return {
        success: true,
        sessionId,
        status: responseData.status,
        participantCount: responseData.participantCount,
        totalParties: responseData.totalParties,
        threshold: responseData.threshold
      };
    } catch (error) {
      console.error('密钥生成失败:', error);
      throw error;
    }
  };

  const startSigning = async (transactionData, walletConfig) => {
    try {
      const response = await axios.post('/api/mpc/sign/start', {
        transactionData,
        walletConfig
      });
      const sessionId = response.data.data.sessionId;

      // 模拟签名进度
      setSigningProgress(0);
      const progressInterval = setInterval(() => {
        setSigningProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 15;
        });
      }, 300);

      // 模拟MPC数据交换
      setTimeout(() => {
        showMPCModal(
          { sessionId, round: 1, signature: 'mock_signature_data' },
          'send'
        );
      }, 1000);

      return {
        success: true,
        sessionId,
        signature: response.data.data.finalSignature
      };
    } catch (error) {
      console.error('签名失败:', error);
      throw error;
    }
  };

  const showMPCModal = (data, type) => {
    setModalData(data);
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalData(null);
  };

  const submitMPCData = async (data) => {
    try {
      // 需要从data中获取sessionId，或者从state中获取
      const sessionId = data.sessionId || modalData?.sessionId;
      if (!sessionId) {
        throw new Error('缺少sessionId');
      }
      await axios.post(`/api/mpc/session/${sessionId}/participant`, {
        participantId: 'participant_' + Date.now(),
        roundData: data
      });
      closeModal();
    } catch (error) {
      console.error('MPC数据提交失败:', error);
      throw error;
    }
  };

  const joinKeyGeneration = async (params) => {
    try {
      // 加入MPC密钥生成过程
      const response = await axios.post('/api/mpc/keygen/join', {
        sessionId: params.sessionId,
        participantId: 'participant_' + Date.now()
      });

      // 模拟密钥生成进度
      setKeyGenProgress(0);
      const progressInterval = setInterval(() => {
        setKeyGenProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 12;
        });
      }, 400);

      // 如果会话已完成，直接返回结果
      if (response.data.data.status === 'completed') {
        setKeyGenProgress(100);
        return {
          success: true,
          sessionId: response.data.data.sessionId,
          keyShares: response.data.data.keyShares,
          publicKey: response.data.data.publicKey,
          address: response.data.data.address
        };
      }

      // 如果还在进行中，显示MPC数据交换模态框
      setTimeout(() => {
        showMPCModal(
          { sessionId: params.sessionId, round: 1, data: 'participant_keygen_data' },
          'send'
        );
      }, 1500);

      return {
        success: true,
        sessionId: response.data.data.sessionId,
        keyShares: response.data.data.keyShares || [],
        publicKey: response.data.data.publicKey,
        address: response.data.data.address,
        status: response.data.data.status
      };
    } catch (error) {
      console.error('加入密钥生成失败:', error);
      throw error;
    }
  };

  const generateInvitationData = (walletConfig, sessionId) => {
    return {
      sessionId,
      walletName: walletConfig.name,
      participants: walletConfig.parties,
      threshold: walletConfig.threshold,
      creator: 'Current User', // 在实际应用中应该是当前用户名
      createdAt: new Date().toISOString(),
      inviteCode: sessionId.substring(8) // 短邀请码
    };
  };

  const value = {
    keyGenProgress,
    signingProgress,
    modalVisible,
    modalData,
    modalType,
    startKeyGeneration,
    joinKeyGeneration,
    generateInvitationData,
    startSigning,
    showMPCModal,
    closeModal,
    submitMPCData
  };

  return (
    <MPCContext.Provider value={value}>
      {children}
    </MPCContext.Provider>
  );
}; 