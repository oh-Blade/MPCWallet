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
        participants: parseInt(config.parties),  // 转换为整数
        threshold: parseInt(config.threshold),   // 转换为整数
        sessionId: 'session_' + Date.now() // 生成会话ID
      };
      
      const response = await axios.post('/api/mpc/keygen/init', requestData);
      const sessionId = response.data.sessionId;

      // 模拟密钥生成进度
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
        keyShares: ['share1', 'share2', 'share3'],
        publicKey: '0x04...',
        address: '0x' + Math.random().toString(16).substr(2, 40)
      };
    } catch (error) {
      console.error('密钥生成失败:', error);
      throw error;
    }
  };

  const startSigning = async (params) => {
    try {
      const response = await axios.post('/api/mpc/sign/init', params);
      const sessionId = response.data.sessionId;

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
        signature: 'mock_signature'
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
      await axios.post(`/api/mpc/session/${sessionId}/data`, data);
      closeModal();
    } catch (error) {
      console.error('MPC数据提交失败:', error);
      throw error;
    }
  };

  const value = {
    keyGenProgress,
    signingProgress,
    modalVisible,
    modalData,
    modalType,
    startKeyGeneration,
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