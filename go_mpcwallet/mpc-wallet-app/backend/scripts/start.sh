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

# 检查 Go 版本
check_go_version() {
    print_message "检查 Go 版本..." "${YELLOW}"
    if ! command -v go &> /dev/null; then
        print_message "错误: 未找到 Go 安装" "${RED}"
        exit 1
    fi
    
    GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
    REQUIRED_VERSION="1.18"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$GO_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_message "错误: Go 版本需要 >= 1.18" "${RED}"
        exit 1
    fi
    
    print_message "Go 版本检查通过: $GO_VERSION" "${GREEN}"
}

# 检查配置文件
check_config() {
    print_message "检查配置文件..." "${YELLOW}"
    if [ ! -f "config/config.yaml" ]; then
        print_message "错误: 配置文件不存在" "${RED}"
        print_message "请创建 config/config.yaml 文件" "${YELLOW}"
        exit 1
    fi
    print_message "配置文件检查通过" "${GREEN}"
}

# 安装依赖
install_dependencies() {
    print_message "安装依赖..." "${YELLOW}"
    go mod download
    if [ $? -ne 0 ]; then
        print_message "错误: 依赖安装失败" "${RED}"
        exit 1
    fi
    print_message "依赖安装完成" "${GREEN}"
}

# 编译项目
build_project() {
    print_message "编译项目..." "${YELLOW}"
    go build -o mpc-wallet
    if [ $? -ne 0 ]; then
        print_message "错误: 项目编译失败" "${RED}"
        exit 1
    fi
    print_message "项目编译完成" "${GREEN}"
}

# 启动服务
start_service() {
    print_message "启动服务..." "${YELLOW}"
    ./mpc-wallet &
    if [ $? -ne 0 ]; then
        print_message "错误: 服务启动失败" "${RED}"
        exit 1
    fi
    print_message "服务启动成功" "${GREEN}"
}

# 主函数
main() {
    print_message "开始启动 MPC Wallet 后端服务..." "${YELLOW}"
    
    # 检查环境
    check_go_version
    check_config
    
    # 安装依赖
    install_dependencies
    
    # 编译项目
    build_project
    
    # 启动服务
    start_service
    
    print_message "MPC Wallet 后端服务启动完成" "${GREEN}"
    print_message "服务运行在后台，使用 'ps aux | grep mpc-wallet' 查看进程" "${YELLOW}"
}

# 执行主函数
main 