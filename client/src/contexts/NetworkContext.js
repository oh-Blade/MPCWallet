import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NetworkContext = createContext();

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }) => {
  const [networkStatus, setNetworkStatus] = useState({
    connected: false,
    chainId: null,
    blockNumber: null,
    gasPrice: null
  });

  const checkNetworkStatus = async () => {
    try {
      const response = await axios.get('/api/blockchain/network-info');
      setNetworkStatus({
        connected: true,
        chainId: response.data.chainId,
        blockNumber: response.data.blockNumber,
        gasPrice: response.data.gasPrice
      });
    } catch (error) {
      console.error('网络状态检查失败:', error);
      setNetworkStatus(prev => ({
        ...prev,
        connected: false
      }));
    }
  };

  const estimateGas = async (transactionParams) => {
    try {
      const response = await axios.post('/api/transaction/estimate-gas', transactionParams);
      return {
        gasLimit: response.data.gasLimit,
        gasPrice: response.data.gasPrice,
        estimatedFee: response.data.estimatedFee
      };
    } catch (error) {
      console.error('Gas估算失败:', error);
      throw error;
    }
  };

  const getTransactionStatus = async (txHash) => {
    try {
      const response = await axios.get(`/api/transaction/status/${txHash}`);
      return response.data;
    } catch (error) {
      console.error('获取交易状态失败:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkNetworkStatus();
    
    // 每30秒检查一次网络状态
    const interval = setInterval(checkNetworkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    networkStatus,
    checkNetworkStatus,
    estimateGas,
    getTransactionStatus
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}; 