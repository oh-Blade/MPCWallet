const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
require('dotenv').config();

const walletRoutes = require('./src/routes/wallet');
const transactionRoutes = require('./src/routes/transaction');
const mpcRoutes = require('./src/routes/mpc');
const blockchainRoutes = require('./src/routes/blockchain');

const app = express();
const PORT = process.env.PORT || 8080;

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api', limiter);

// 解析请求体
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/wallet', walletRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/mpc', mpcRoutes);
app.use('/api/blockchain', blockchainRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'MPC 钱包后端服务运行中',
    version: '1.0.0',
    endpoints: {
      wallet: '/api/wallet',
      transaction: '/api/transaction',
      mpc: '/api/mpc',
      blockchain: '/api/blockchain',
      health: '/health'
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '内部服务器错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '服务暂时不可用'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 MPC钱包服务器运行在端口 ${PORT}`);
  console.log(`📝 健康检查: http://localhost:${PORT}/health`);
  console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
});