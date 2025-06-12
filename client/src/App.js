import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, message, Spin } from 'antd';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import WalletCreate from './components/WalletCreate';
import WalletList from './components/WalletList';
import Transaction from './components/Transaction';
import MPCDataModal from './components/MPCDataModal';
import { WalletProvider } from './contexts/WalletContext';
import { MPCProvider } from './contexts/MPCContext';
import { NetworkProvider } from './contexts/NetworkContext';
import './App.css';

const { Content } = Layout;

function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser] = useState('user_' + Date.now()); // 模拟用户ID

  useEffect(() => {
    // 初始化应用
    const initApp = async () => {
      try {
        // 检查后端连接
        const response = await fetch('/health');
        if (response.ok) {
          message.success('应用初始化成功');
        } else {
          message.warning('后端服务连接异常，请检查服务器状态');
        }
      } catch (error) {
        console.error('初始化失败:', error);
        message.error('应用初始化失败');
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <Spin size="large" />
        <div style={{ marginTop: 16, color: 'white' }}>
          正在初始化 MPC 钱包应用...
        </div>
      </div>
    );
  }

  return (
    <NetworkProvider>
      <WalletProvider currentUser={currentUser}>
        <MPCProvider>
          <Router>
            <div className="app-container">
              <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
                <Header />
                <Content className="content-container">
                  <div className="fade-in">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/wallet/create" element={<WalletCreate />} />
                      <Route path="/wallet/list" element={<WalletList />} />
                      <Route path="/transaction" element={<Transaction />} />
                    </Routes>
                  </div>
                </Content>
                <MPCDataModal />
              </Layout>
            </div>
          </Router>
        </MPCProvider>
      </WalletProvider>
    </NetworkProvider>
  );
}

export default App; 