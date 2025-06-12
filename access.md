### 🚀 第一阶段：理解项目整体架构 (30分钟)

3. **`app/src/main/AndroidManifest.xml`** - 了解应用权限和组件声明
4. **`MPCWalletApplication.kt`** - 应用程序入口点和全局配置

### 🏗️ 第二阶段：核心密码学组件 (45分钟)

5. **`crypto/MPCKeyGenerator.kt`** - MPC密钥生成的核心逻辑
6. **`crypto/MPCSigner.kt`** - MPC签名的核心实现
7. **`utils/QRCodeManager.kt`** - 二维码通信机制

### 📊 第三阶段：数据层和模型 (30分钟)

8. **`data/models/`** 目录下的所有模型文件 - 了解数据结构
9. **`data/database/`** 目录下的数据库相关文件 - 了解数据持久化

### 🌐 第四阶段：网络服务层 (20分钟)

10. **`network/EthereumService.kt`** - 以太坊网络交互逻辑

### 🎨 第五阶段：用户界面层 (60分钟)

11. **`ui/MainActivity.kt`** - 主活动和应用启动
12. **`ui/navigation/`** - 导航逻辑
13. **`ui/viewmodels/`** - 视图模型和业务逻辑
14. **`ui/screens/`** - 主要界面实现
15. **`ui/components/`** - 可复用UI组件
16. **`ui/theme/`** - UI主题配置

### ⚡ 重点关注的核心功能流程

在阅读过程中，特别关注这些关键功能的实现：

1. **MPC密钥生成流程** (`MPCKeyGenerator.kt`)
2. **MPC签名过程** (`MPCSigner.kt`) 
3. **二维码数据分片和重组** (`QRCodeManager.kt`)
4. **以太坊交易创建和广播** (`EthereumService.kt`)
5. **用户界面的状态管理** (viewmodels目录)

### 📝 阅读建议

- **先宏观后微观**：先理解整体架构，再深入具体实现
- **关注数据流**：理解数据如何在各层之间流动
- **重点关注安全性**：这是一个钱包应用，安全是首要考虑
- **理解MPC原理**：多方计算是这个项目的核心特色

您想从哪个部分开始详细了解？我可以为您详细解释任何特定文件的内容和功能。