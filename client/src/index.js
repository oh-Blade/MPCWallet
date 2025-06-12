import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';

// 配置 Ant Design 的主题
const theme = {
  token: {
    colorPrimary: '#667eea',
    borderRadius: 8,
    wireframe: false,
  },
  components: {
    Button: {
      borderRadius: 8,
    },
    Card: {
      borderRadius: 12,
    },
    Modal: {
      borderRadius: 12,
    },
    Input: {
      borderRadius: 8,
    },
  },
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider 
      locale={zhCN} 
      theme={theme}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
); 