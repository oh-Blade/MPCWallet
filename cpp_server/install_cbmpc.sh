#!/bin/bash

set -e

echo "🚀 开始安装 Coinbase cb-mpc 库..."

# 检查系统
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 检测到 Linux 系统"
    # 安装依赖
    sudo apt-get update
    sudo apt-get install -y cmake build-essential libssl-dev git
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 检测到 macOS 系统"
    # 检查 Homebrew
    if ! command -v brew &> /dev/null; then
        echo "❌ 请先安装 Homebrew: https://brew.sh/"
        exit 1
    fi
    brew install cmake openssl git
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    exit 1
fi

# 创建工作目录
mkdir -p ../external
cd ../external

# 克隆 cb-mpc 仓库
echo "📥 克隆 cb-mpc 仓库..."
if [ -d "cb-mpc" ]; then
    echo "📁 cb-mpc 目录已存在，拉取最新代码..."
    cd cb-mpc
    git pull
else
    git clone https://github.com/coinbase/cb-mpc.git
    cd cb-mpc
fi

# 初始化子模块
echo "🔄 初始化子模块..."
git submodule update --init --recursive

# 编译选项：Docker 或本地
read -p "🐳 是否使用 Docker 编译？(推荐) [Y/n]: " use_docker
use_docker=${use_docker:-Y}

if [[ $use_docker =~ ^[Yy]$ ]]; then
    echo "🐳 使用 Docker 编译..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 构建 Docker 镜像
    echo "🏗️  构建 Docker 镜像..."
    make image
    
    # 在 Docker 中编译
    echo "⚙️  在 Docker 中编译..."
    docker run -it --rm -v $(pwd):/code -t cb-mpc bash -c 'make build'
    
else
    echo "🛠️  本地编译..."
    
    # 本地编译
    mkdir -p build
    cd build
    
    # CMake 配置
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS 需要指定 OpenSSL 路径
        cmake -DOPENSSL_ROOT_DIR=$(brew --prefix openssl) ..
    else
        cmake ..
    fi
    
    # 编译
    make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
    
    cd ..
fi

# 运行测试
echo "🧪 运行测试..."
if [[ $use_docker =~ ^[Yy]$ ]]; then
    docker run -it --rm -v $(pwd):/code -t cb-mpc bash -c 'make test'
else
    make test
fi

# 复制库文件到项目
echo "📦 复制库文件到项目..."
cd ../../cpp_server

# 创建目录
mkdir -p include/cb-mpc
mkdir -p lib

# 复制头文件
echo "📁 复制头文件..."
cp -r ../external/cb-mpc/src/cbmpc include/cb-mpc/

# 复制库文件
echo "📚 复制库文件..."
if [ -f "../external/cb-mpc/build/libcbmpc.a" ]; then
    cp ../external/cb-mpc/build/libcbmpc.a lib/
elif [ -f "../external/cb-mpc/build/src/libcbmpc.a" ]; then
    cp ../external/cb-mpc/build/src/libcbmpc.a lib/
else
    echo "⚠️  未找到编译好的库文件，请检查编译是否成功"
fi

# 创建测试编译配置
echo "📝 创建 CMake 配置..."
cat > CMakeLists_real.txt << 'EOF'
cmake_minimum_required(VERSION 3.15)
project(MPCWalletReal)

set(CMAKE_CXX_STANDARD 17)

# 查找 OpenSSL
find_package(OpenSSL REQUIRED)

# 包含目录
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include/cb-mpc)

# 可执行文件
add_executable(mpc_server_real mpc_server_real.cpp)

# 链接库
target_link_libraries(mpc_server_real 
    ${CMAKE_CURRENT_SOURCE_DIR}/lib/libcbmpc.a
    OpenSSL::SSL 
    OpenSSL::Crypto
    pthread
)

# macOS 特定设置
if(APPLE)
    target_link_libraries(mpc_server_real "-framework Security")
endif()
EOF

# 测试编译
echo "🔨 测试编译真实 MPC 服务器..."
mkdir -p build_real
cd build_real

if [[ "$OSTYPE" == "darwin"* ]]; then
    cmake -DOPENSSL_ROOT_DIR=$(brew --prefix openssl) -f ../CMakeLists_real.txt ..
else
    cmake -f ../CMakeLists_real.txt ..
fi

if make mpc_server_real; then
    echo "✅ 真实 MPC 服务器编译成功！"
    echo "🎯 可执行文件: $(pwd)/mpc_server_real"
else
    echo "❌ 编译失败，请检查错误信息"
    exit 1
fi

cd ..

echo ""
echo "🎉 cb-mpc 库安装完成！"
echo ""
echo "📋 下一步："
echo "   1. 运行真实 MPC 服务器: ./build_real/mpc_server_real"
echo "   2. 查看集成指南: cat REAL_MPC_INTEGRATION.md"
echo "   3. 开发真实的 MPC 功能"
echo ""
echo "🔗 参考资料:"
echo "   - cb-mpc 文档: https://github.com/coinbase/cb-mpc"
echo "   - API 规范: https://github.com/coinbase/cb-mpc/tree/master/docs"
echo "" 