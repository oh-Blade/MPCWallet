# MPC Wallet 配置指南

## 📋 概述

本指南将帮助您正确配置MPC钱包应用的不同环境，包括API密钥、网络配置等敏感信息的管理。

## 🔐 安全配置系统

### 配置文件层级（优先级从高到低）
```
1. local.properties     ← 本地开发配置（最高优先级，不提交到Git）
2. gradle.properties    ← 默认配置（提交到Git，使用占位符）
3. BuildConfig默认值    ← 代码中的备用值
```

## ⚙️ 快速配置步骤

### 1. 复制配置模板
```bash
cp local.properties.example local.properties
```

### 2. 获取Infura API密钥
1. 访问 [Infura.io](https://infura.io/) 
2. 注册账号并创建新项目
3. 在项目设置中找到：
   - **Project ID**（项目ID）
   - **API Key**（API密钥）

### 3. 编辑local.properties
```properties
# 填入您的真实密钥
INFURA_API_KEY=your_real_infura_api_key_here
INFURA_PROJECT_ID=your_real_project_id_here

# 选择网络环境
DEFAULT_NETWORK=sepolia  # 开发环境建议使用测试网

# 其他配置
ENABLE_DEBUG_LOGGING=true
ENABLE_BIOMETRIC=true
MIN_PASSWORD_LENGTH=8
```

## 🌍 环境配置

### 开发环境 (Debug)
```properties
DEFAULT_NETWORK=sepolia
ENABLE_DEBUG_LOGGING=true
INFURA_API_KEY=your_development_key
```
- **特点**：使用测试网，启用详细日志
- **构建命令**：`./gradlew assembleDebug`

### 测试环境 (Staging)  
```properties
DEFAULT_NETWORK=sepolia
ENABLE_DEBUG_LOGGING=true
INFURA_API_KEY=your_staging_key
```
- **特点**：使用测试网，但接近生产配置
- **构建命令**：`./gradlew assembleStaging`

### 生产环境 (Release)
```properties
DEFAULT_NETWORK=mainnet
ENABLE_DEBUG_LOGGING=false
INFURA_API_KEY=your_production_key
```
- **特点**：使用主网，关闭调试日志
- **构建命令**：`./gradlew assembleRelease`

## 📱 支持的网络

| 网络名称 | 配置值 | 用途 |
|---------|--------|------|
| 以太坊主网 | `mainnet` | 生产环境 |
| Sepolia测试网 | `sepolia` | 开发/测试 |
| Polygon主网 | `polygon` | Polygon Layer2 |
| Mumbai测试网 | `mumbai` | Polygon测试 |

## 🔧 代码中使用配置

### 通过ConfigManager访问（推荐）
```kotlin
import com.mpcwallet.app.utils.ConfigManager

// 获取API密钥
val apiKey = ConfigManager.infuraApiKey

// 获取网络URL
val url = ConfigManager.getInfuraUrl("mainnet")

// 检查环境
if (ConfigManager.isDebugBuild) {
    Log.d("Debug", "这是调试模式")
}

// 验证配置
if (!ConfigManager.validateConfiguration()) {
    // 配置无效，提示用户
}
```

### 直接使用BuildConfig
```kotlin
import com.mpcwallet.app.BuildConfig

val apiKey = BuildConfig.INFURA_API_KEY
val isDebug = BuildConfig.ENABLE_DEBUG_LOGGING
```

## 🛡️ 安全最佳实践

### ✅ 应该做的
- ✅ 将真实密钥放在`local.properties`中
- ✅ 不同环境使用不同的API密钥
- ✅ 生产环境关闭调试日志
- ✅ 定期轮换API密钥
- ✅ 使用最小权限原则

### ❌ 不应该做的
- ❌ 将真实密钥写在代码中
- ❌ 将`local.properties`提交到Git
- ❌ 在生产环境使用测试密钥
- ❌ 在日志中打印完整的API密钥
- ❌ 与他人分享生产环境密钥

## 🔍 配置验证

### 运行时检查
应用启动时会自动验证配置：
```
=== MPC Wallet 配置摘要 ===
构建类型: debug
网络环境: Sepolia测试网
API地址: https://sepolia.infura.io/v3/
调试模式: true
生物识别: true
配置有效: true
========================
```

### 手动验证
```kotlin
// 检查配置是否有效
if (ConfigManager.validateConfiguration()) {
    // 配置正确
} else {
    // 配置有问题，需要检查
}
```

## 🚨 故障排除

### 问题：编译时提示找不到BuildConfig
**解决方案**：
```gradle
android {
    buildFeatures {
        buildConfig true  // 确保启用
    }
}
```

### 问题：API密钥无效
**检查步骤**：
1. 确认`local.properties`中的密钥正确
2. 验证Infura项目是否激活
3. 检查网络配置是否匹配

### 问题：无法连接到网络
**检查步骤**：
1. 确认网络名称拼写正确
2. 验证对应网络的Infura端点是否启用
3. 检查网络权限配置

## 📞 获取帮助

如果在配置过程中遇到问题：
1. 查看应用日志中的配置摘要
2. 确认所有必需的配置项都已填写
3. 验证API密钥在Infura控制台中的状态
4. 检查网络连接和权限设置

---

**注意**：请妥善保管您的API密钥，不要在公开场合分享或提交到版本控制系统！ 