#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
let port = 3000; // 默认端口

// 查找端口参数
const portArgIndex = args.findIndex(arg => arg === '--port' || arg === '-p');
if (portArgIndex !== -1 && args[portArgIndex + 1]) {
  const portValue = parseInt(args[portArgIndex + 1]);
  if (!isNaN(portValue) && portValue > 0 && portValue < 65536) {
    port = portValue;
  } else {
    console.error('❌ 错误: 端口号必须是 1-65535 之间的数字');
    process.exit(1);
  }
}

// 设置环境变量
process.env.PORT = port.toString();

console.log(`🚀 正在启动 MPC 钱包客户端，端口: ${port}`);

// 启动 React 应用
const child = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: process.env,
  shell: true
});

child.on('error', (error) => {
  console.error('❌ 启动失败:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});

// 处理进程信号
process.on('SIGINT', () => {
  console.log('\n👋 正在停止服务...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
}); 