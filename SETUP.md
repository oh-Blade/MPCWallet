# MPC钱包项目设置说明

## 项目概述

这是一个基于Coinbase MPC库概念的Android多方计算钱包应用。该项目实现了：

1. **纯客户端架构** - 无需API服务器
2. **二维码通信** - 设备间通过QR码传递MPC数据
3. **多链支持** - 以太坊、比特币、Polygon、BSC
4. **Infura集成** - 通过Infura API连接以太坊网络

## 关键文件说明

### 核心密码学组件
- `app/src/main/java/com/mpcwallet/app/crypto/MPCKeyGenerator.kt` - MPC密钥生成器
- `app/src/main/java/com/mpcwallet/app/crypto/MPCSigner.kt` - MPC签名器
- `app/src/main/java/com/mpcwallet/app/utils/QRCodeManager.kt` - 二维码管理器

### 网络服务
- `app/src/main/java/com/mpcwallet/app/network/EthereumService.kt` - 以太坊网络接口

### 数据层
- `app/src/main/java/com/mpcwallet/app/data/models/` - 数据模型定义
- `app/src/main/java/com/mpcwallet/app/data/database/` - Room数据库配置

### 用户界面
- `app/src/main/java/com/mpcwallet/app/ui/` - Jetpack Compose界面组件

## 配置步骤

### 1. 环境要求
- Android Studio Hedgehog | 2023.1.1+
- JDK 8+
- Android SDK API Level 24+

### 2. Infura API密钥配置
在 `app/src/main/java/com/mpcwallet/app/MPCWalletApplication.kt` 中：

```kotlin
companion object {
    // 替换为您的Infura项目ID
    private const val INFURA_KEY = "YOUR_INFURA_KEY_HERE"
}
```

### 3. 构建项目
```bash
./gradlew build
```

### 4. 运行应用
```bash
./gradlew installDebug
```

## 技术架构

### MPC实现说明
本项目包含了MPC（多方计算）的概念验证实现：

1. **密钥生成** - 使用Shamir秘密分享方案
2. **签名过程** - 基于ECDSA的阈值签名
3. **QR码通信** - 将MPC数据编码为QR码进行设备间传输

### 安全考虑
- 密钥分片使用AES-256加密存储
- 禁用应用数据备份（防止敏感数据泄露）
- 支持硬件安全模块集成

### 二维码通信协议
```json
{
  "type": "KEY_GENERATION_INIT",
  "payload": "加密的MPC数据",
  "sessionId": "会话标识符",
  "partyId": "参与方标识",
  "sequence": 1,
  "totalSequences": 1,
  "timestamp": 1234567890
}
```

## 功能模块

### 已实现功能
- [x] 基础UI框架（Jetpack Compose）
- [x] MPC密钥生成器（概念验证）
- [x] MPC签名器（概念验证）
- [x] 二维码生成和解析
- [x] 以太坊网络集成（Infura）
- [x] Room数据库存储
- [x] 钱包管理界面

### 待实现功能
- [ ] 完整的MPC协议实现
- [ ] QR码扫描功能
- [ ] 交易创建和广播
- [ ] 生物识别认证
- [ ] 密钥备份和恢复
- [ ] 多设备同步测试

## 开发注意事项

### 1. 密码学安全
当前的MPC实现仅为概念验证。生产环境需要：
- 集成经过审计的MPC库（如Coinbase CB-MPC）
- 硬件安全模块（HSM）支持
- 形式化安全验证

### 2. 网络配置
- 默认连接Sepolia测试网
- 可在`EthereumService.kt`中修改网络配置
- 支持Polygon和BSC网络

### 3. 依赖库
主要依赖：
- BouncyCastle（密码学）
- Web3j（以太坊客户端）
- ZXing（二维码）
- Room（数据库）
- Jetpack Compose（UI）

## 测试说明

### 单元测试
```bash
./gradlew test
```

### 模拟器测试
```bash
./gradlew connectedAndroidTest
```

### 多设备测试
建议使用多个Android设备或模拟器测试MPC协议的完整流程。

## 部署构建

### Debug构建
```bash
./gradlew assembleDebug
```

### Release构建
```bash
./gradlew assembleRelease
```

## 免责声明

⚠️ **警告**: 这是一个学习和概念验证项目，不应用于存储真实的加密货币资产。任何生产使用都需要：

1. 完整的安全审计
2. 密码学专家评估
3. 大量测试和验证
4. 监管合规检查

## 联系支持

如有技术问题，请：
- 查看项目文档
- 创建GitHub Issue
- 联系开发团队

---

**祝您使用愉快！** 🚀 