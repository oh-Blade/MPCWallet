#!/bin/bash

# MPC 钱包 C++ 服务器启动脚本

echo "🎯 MPC钱包 C++ 服务器启动脚本"
echo "================================"

# 检查是否已编译
if [ ! -f "mpc_wallet_server" ]; then
    echo "📦 正在编译服务器..."
    make
    if [ $? -ne 0 ]; then
        echo "❌ 编译失败，请检查错误信息"
        exit 1
    fi
    echo "✅ 编译成功"
fi

# 设置默认端口
if [ -z "$PORT" ]; then
    export PORT=8080
fi

echo "🚀 启动服务器 (端口: $PORT)"
echo "📝 按 Ctrl+C 停止服务器"
echo "================================"

# 启动服务器
./mpc_wallet_server

echo "👋 服务器已停止" 