#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 查找并停止服务
stop_service() {
    print_message "查找 MPC Wallet 服务进程..." "${YELLOW}"
    
    # 查找服务进程
    PID=$(ps aux | grep mpc-wallet | grep -v grep | awk '{print $2}')
    
    if [ -z "$PID" ]; then
        print_message "未找到运行中的 MPC Wallet 服务" "${YELLOW}"
        return
    fi
    
    print_message "找到服务进程 PID: $PID" "${YELLOW}"
    
    # 发送终止信号
    print_message "正在停止服务..." "${YELLOW}"
    kill $PID
    
    # 等待进程终止
    sleep 2
    
    # 检查进程是否还在运行
    if ps -p $PID > /dev/null; then
        print_message "服务未响应终止信号，强制终止..." "${YELLOW}"
        kill -9 $PID
    fi
    
    print_message "服务已停止" "${GREEN}"
}

# 清理编译文件
cleanup() {
    print_message "清理编译文件..." "${YELLOW}"
    if [ -f "mpc-wallet" ]; then
        rm mpc-wallet
        print_message "已删除编译文件" "${GREEN}"
    fi
}

# 主函数
main() {
    print_message "开始停止 MPC Wallet 后端服务..." "${YELLOW}"
    
    # 停止服务
    stop_service
    
    # 清理文件
    cleanup
    
    print_message "MPC Wallet 后端服务已完全停止" "${GREEN}"
}

# 执行主函数
main 