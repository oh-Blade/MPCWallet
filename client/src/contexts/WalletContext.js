import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children, currentUser }) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  const createWallet = async (walletData) => {
    setLoading(true);
    try {
      // 转换参数名以匹配后端API，确保数字类型
      const requestData = {
        participantCount: parseInt(walletData.parties),  // 转换为整数
        threshold: parseInt(walletData.threshold),       // 转换为整数
        userId: currentUser
      };
      
      const response = await axios.post('/api/wallet/create', requestData);
      const newWallet = { 
        ...response.data, 
        createdAt: new Date().toISOString(),
        // 保留原始的前端参数名用于显示
        name: walletData.name,
        description: walletData.description,
        parties: walletData.parties
      };
      setWallets(prev => [...prev, newWallet]);
      return newWallet;
    } catch (error) {
      console.error('创建钱包失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshWallets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/wallet/list/${currentUser}`);
      // 确保返回的数据是数组
      const walletsData = Array.isArray(response.data) ? response.data : [];
      setWallets(walletsData);
    } catch (error) {
      console.error('获取钱包列表失败:', error);
      // 出错时保持空数组
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  const getWalletBalance = async (address) => {
    try {
      const response = await axios.get(`/api/blockchain/balance/${address}`);
      const balance = response.data.balance;
      
      setWallets(prev => {
        // 确保prev是数组
        const walletsArray = Array.isArray(prev) ? prev : [];
        return walletsArray.map(wallet => 
          wallet.address === address ? { ...wallet, balance } : wallet
        );
      });
      
      return balance;
    } catch (error) {
      console.error('获取余额失败:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshWallets();
  }, [currentUser]);

  const joinWallet = async (walletData) => {
    setLoading(true);
    try {
      // 对于加入的钱包，直接保存到本地状态
      // 在实际应用中，这里应该也调用后端API来注册参与者
      const newWallet = { 
        ...walletData, 
        createdAt: new Date().toISOString(),
        id: 'wallet_' + Date.now()
      };
      setWallets(prev => [...prev, newWallet]);
      return newWallet;
    } catch (error) {
      console.error('加入钱包失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    wallets,
    loading,
    createWallet,
    joinWallet,
    refreshWallets,
    getWalletBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 