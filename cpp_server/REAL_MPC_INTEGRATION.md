# 🔐 真实MPC实现集成指南

## 📋 当前状态

**当前实现**: `mpc_server.cpp` 是**纯模拟实现**，只返回静态JSON数据，没有真实的密码学操作。

**目标**: 集成 [Coinbase cb-mpc 库](https://github.com/coinbase/cb-mpc) 实现真实的多方计算功能。

## 🎯 为什么需要真实实现？

### 当前模拟实现的问题：

```cpp
// 当前的"密钥生成" - 只是返回假数据
routes_["POST /api/mpc/keygen/start"] = [this](const std::string& body) -> std::string {
    std::ostringstream data;
    data << "{\"sessionId\":\"mpc_session_" << std::time(nullptr) 
         << "\",\"status\":\"started\"}";  // 完全是假的！
    return createSuccessResponse(data.str());
};
```

### 真实实现应该做什么：

1. **真实的分布式密钥生成** - 多方协作生成私钥分片
2. **真实的多方签名** - 不泄露私钥的协作签名
3. **安全的密钥分片存储** - 每个参与方只知道自己的分片
4. **抗恶意攻击** - 防止参与方作恶

## 🛠️ cb-mpc 库功能

### 支持的协议：

| 协议 | 功能 | cb-mpc 实现 |
|------|------|-------------|
| **EC-DKG** | 椭圆曲线分布式密钥生成 | `coinbase::mpc::eckey` |
| **ECDSA-2PC** | 两方ECDSA签名 | `coinbase::mpc::ecdsa2pc` |
| **ECDSA-MPC** | 多方ECDSA签名 | `coinbase::mpc::ecdsampc` |
| **Schnorr-2PC** | 两方Schnorr签名 | `coinbase::mpc::schnorr2p` |
| **Zero-Knowledge Proofs** | 零知识证明 | `coinbase::mpc::zk` |

### 实际代码示例：

```cpp
// 真实的密钥生成
#include "cbmpc/protocol/ec_dkg.h"

// 初始化2-of-2密钥生成
auto keygen = std::make_shared<coinbase::mpc::eckey::keygen_t>();
keygen->init(2, 2); // 2个参与方，阈值为2

// 执行第一轮协议
auto round1_data = keygen->round1();

// 处理其他参与方的数据
keygen->process_round2(partner_round1_data);

// 获取最终的密钥分片
auto key_share = keygen->get_key_share();
```

## 📦 安装 cb-mpc 库

### 1. 克隆仓库

```bash
git clone https://github.com/coinbase/cb-mpc.git
cd cb-mpc
```

### 2. 安装依赖

#### Ubuntu/Debian:
```bash
sudo apt-get install cmake build-essential libssl-dev
```

#### macOS:
```bash
brew install cmake openssl
```

### 3. 编译库

```bash
# 初始化子模块
git submodule update --init --recursive

# 使用Docker编译（推荐）
make image
docker run -it --rm -v $(pwd):/code -t cb-mpc bash -c 'make build'

# 或者本地编译
mkdir build && cd build
cmake ..
make -j$(nproc)
```

### 4. 测试安装

```bash
make test
```

## 🔧 集成到我们的项目

### 1. 更新项目结构

```
cpp_server/
├── mpc_server.cpp              # 当前模拟版本
├── mpc_server_real.cpp         # 新的真实实现
├── include/
│   ├── cb-mpc/                 # cb-mpc库头文件
│   └── mpc_wrapper.h           # 封装层
├── lib/
│   └── libcbmpc.a             # 编译好的cb-mpc库
└── CMakeLists_real.txt        # 支持cb-mpc的构建配置
```

### 2. 创建封装层

`include/mpc_wrapper.h`:
```cpp
#pragma once
#include "cbmpc/protocol/ec_dkg.h"
#include "cbmpc/protocol/ecdsa_2p.h"
#include <memory>
#include <string>

class MPCWrapper {
public:
    // 密钥生成会话
    struct KeygenSession {
        std::shared_ptr<coinbase::mpc::eckey::keygen_t> keygen;
        std::string sessionId;
        int currentRound;
        bool isComplete;
    };
    
    // 签名会话
    struct SigningSession {
        std::shared_ptr<coinbase::mpc::ecdsa2pc::signing_t> signer;
        std::string sessionId;
        int currentRound;
        bool isComplete;
    };
    
    // 创建密钥生成会话
    KeygenSession* createKeygenSession(int participants, int threshold);
    
    // 处理密钥生成轮次
    std::string processKeygenRound(KeygenSession* session, const std::string& partnerData);
    
    // 创建签名会话
    SigningSession* createSigningSession(const std::string& keyShare, const std::string& message);
    
    // 处理签名轮次
    std::string processSigningRound(SigningSession* session, const std::string& partnerData);
};
```

### 3. 更新构建配置

`CMakeLists_real.txt`:
```cmake
cmake_minimum_required(VERSION 3.15)
project(MPCWalletReal)

set(CMAKE_CXX_STANDARD 17)

# 查找 cb-mpc 库
find_library(CBMPC_LIB cbmpc PATHS ${CMAKE_CURRENT_SOURCE_DIR}/lib)
find_path(CBMPC_INCLUDE cbmpc PATHS ${CMAKE_CURRENT_SOURCE_DIR}/include)

# 包含目录
include_directories(${CBMPC_INCLUDE})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# 查找 OpenSSL
find_package(OpenSSL REQUIRED)

# 可执行文件
add_executable(mpc_server_real 
    mpc_server_real.cpp
    src/mpc_wrapper.cpp
)

# 链接库
target_link_libraries(mpc_server_real 
    ${CBMPC_LIB}
    OpenSSL::SSL 
    OpenSSL::Crypto
    pthread
)
```

## 🚀 实际使用示例

### 1. 真实的密钥生成API

```cpp
routes_["POST /api/mpc/keygen/start"] = [this](const std::string& body) -> std::string {
    try {
        // 解析请求参数
        auto params = parseJSON(body);
        int participants = params["participants"];
        int threshold = params["threshold"];
        
        // 创建真实的密钥生成会话
        auto session = mpcWrapper_.createKeygenSession(participants, threshold);
        
        // 生成第一轮数据
        auto round1Data = session->keygen->round1();
        
        // 存储会话
        keygenSessions_[session->sessionId] = session;
        
        std::ostringstream response;
        response << "{"
                 << "\"sessionId\":\"" << session->sessionId << "\","
                 << "\"round1Data\":\"" << encodeBase64(round1Data) << "\","
                 << "\"status\":\"round1_ready\""
                 << "}";
        
        return createSuccessResponse(response.str());
        
    } catch (const std::exception& e) {
        return createErrorResponse("密钥生成失败: " + std::string(e.what()));
    }
};
```

### 2. 真实的签名API

```cpp
routes_["POST /api/mpc/sign/start"] = [this](const std::string& body) -> std::string {
    try {
        auto params = parseJSON(body);
        std::string walletId = params["walletId"];
        std::string message = params["message"];
        
        // 加载密钥分片
        auto keyShare = loadKeyShare(walletId);
        
        // 创建签名会话
        auto session = mpcWrapper_.createSigningSession(keyShare, message);
        
        // 生成第一轮签名数据
        auto round1Data = session->signer->round1();
        
        signinSessions_[session->sessionId] = session;
        
        std::ostringstream response;
        response << "{"
                 << "\"sessionId\":\"" << session->sessionId << "\","
                 << "\"round1Data\":\"" << encodeBase64(round1Data) << "\","
                 << "\"message\":\"" << message << "\""
                 << "}";
        
        return createSuccessResponse(response.str());
        
    } catch (const std::exception& e) {
        return createErrorResponse("签名启动失败: " + std::string(e.what()));
    }
};
```

## ⚠️ 安全注意事项

### 1. 密钥分片存储
- **绝不能**将密钥分片存储在明文中
- 使用硬件安全模块(HSM)或安全存储
- 实现适当的访问控制

### 2. 网络通信
- 所有MPC协议数据必须通过TLS传输
- 实现消息认证和完整性检查
- 防止重放攻击

### 3. 参与方验证
- 验证参与方身份
- 实现防作弊机制
- 记录审计日志

## 🧪 测试方案

### 1. 单元测试
```bash
# 编译测试版本
cmake -DBUILD_TESTING=ON ..
make

# 运行测试
./test_mpc_integration
```

### 2. 集成测试
```bash
# 启动真实MPC服务器
./mpc_server_real

# 测试真实密钥生成
curl -X POST http://localhost:8080/api/mpc/keygen/start \
  -H "Content-Type: application/json" \
  -d '{"participants": 2, "threshold": 2}'
```

## 📈 性能对比

| 操作 | 模拟实现 | 真实实现 |
|------|----------|----------|
| 密钥生成 | ~1ms | ~100-500ms |
| 签名 | ~1ms | ~50-200ms |
| 内存使用 | ~5MB | ~20-50MB |
| 安全性 | ❌ 无 | ✅ 密码学安全 |

## 🎯 下一步行动

1. **安装cb-mpc库** - 按照上述步骤安装
2. **实现封装层** - 创建C++封装类
3. **更新服务器** - 替换模拟实现
4. **安全审计** - 确保密钥分片安全存储
5. **性能优化** - 根据实际使用情况优化

---

**总结**: 当前的实现确实是模拟的，集成cb-mpc库可以提供真实的MPC功能，但需要额外的开发工作和安全考虑。 