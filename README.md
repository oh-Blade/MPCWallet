# MPC 钱包应用

基于 cb-mpc 库的多方计算钱包 Web 应用，支持以太坊网络的多方计算钱包创建、交易发起和签名。

## 功能特性

- 🔐 **多方计算钱包创建** - 支持 2-of-2 和多方阈值钱包
- 💸 **交易发起与签名** - 支持以太坊网络交易
- 🌐 **以太坊网络支持** - 集成 Infura 节点
- 📱 **响应式 UI** - 现代化的用户界面
- 🔄 **多方数据交互** - 弹窗形式展示交互数据（支持未来二维码扩展）
- 🔒 **安全设计** - 基于 MPC 协议的安全多方计算

## 技术栈

- **前端**: React, TypeScript, Ant Design
- **后端**: Node.js, Express (+ C++ 高性能版本)
- **区块链**: Ethers.js, Infura
- **密码学**: cb-mpc 库（通过 WebAssembly）
- **状态管理**: React Context + Hooks

## 项目结构

```
mpc-wallet-app/
├── client/                 # React 前端应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── contexts/       # React Contexts
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── services/       # API 服务
│   │   ├── types/          # TypeScript 类型定义
│   │   └── utils/          # 工具函数
│   └── public/
├── server/                 # Node.js 后端服务
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── routes/         # 路由
│   │   └── utils/          # 工具函数
│   └── index.js
├── cpp_server/             # C++ 高性能后端服务 (新增)
│   ├── mpc_server.cpp      # 主服务器实现
│   ├── Makefile            # 构建配置
│   ├── start.sh            # 启动脚本
│   └── README.md           # 详细文档
├── docs/                   # 文档
├── scripts/                # 构建脚本
└── CPP_SERVER.md           # C++ 服务器说明
```

## 安装和运行

### 前提条件

- Node.js 18+
- npm 或 yarn
- Infura 项目 ID

### 快速开始

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd mpc-wallet-app
   ```

2. **安装依赖**
   ```bash
   npm run install-all
   ```

3. **配置环境变量**
   ```bash
   # 在 server 目录下创建 .env 文件
   cd server
   cp .env.example .env
   # 编辑 .env 文件，添加你的 Infura Project ID
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

   这将同时启动前端开发服务器 (http://localhost:3000) 和后端 API 服务器 (http://localhost:8080)

### C++ 高性能服务器 (可选)

如果需要更高性能的后端服务，可以使用 C++ 版本：

```bash
cd cpp_server
make && ./mpc_wallet_server
```

详细信息请参考 [CPP_SERVER.md](CPP_SERVER.md)

### 生产环境部署

1. **构建前端应用**
   ```bash
   npm run build
   ```

2. **启动生产服务器**
   ```bash
   npm start
   ```

## 使用说明

### 1. 创建多方计算钱包

1. 在主界面点击"创建新钱包"
2. 选择参与方数量（当前支持 2-of-2）
3. 系统会生成第一方的密钥分片
4. 将显示的数据分享给其他参与方
5. 等待其他参与方完成密钥生成协议

### 2. 发起交易

1. 在钱包界面点击"发送交易"
2. 输入接收地址和金额
3. 系统会发起多方签名协议
4. 与其他参与方完成交互数据交换
5. 交易签名完成后自动广播到网络

### 3. 多方数据交互

- 系统会在需要多方交互时弹出数据交换窗口
- 当前显示 JSON 格式的交互数据
- 用户可复制数据发送给其他参与方
- 支持导入其他参与方的响应数据
- 未来版本将支持二维码扫描方式

## API 文档

### 后端 API

- `POST /api/wallet/create` - 创建钱包
- `POST /api/wallet/import` - 导入钱包
- `GET /api/wallet/balance/:address` - 获取余额
- `POST /api/transaction/create` - 创建交易
- `POST /api/transaction/sign` - 签名交易
- `POST /api/transaction/broadcast` - 广播交易
- `POST /api/mpc/keygen` - MPC 密钥生成
- `POST /api/mpc/sign` - MPC 签名

详细 API 文档请参考 [API.md](docs/API.md)

## 安全注意事项

1. **私钥安全**: 私钥分片仅存储在本地，不会发送到服务器
2. **网络安全**: 建议在生产环境中使用 HTTPS
3. **多方验证**: 在进行重要操作前，请验证其他参与方的身份
4. **备份重要**: 请妥善保管钱包备份和恢复短语

## 开发指南

### 添加新的区块链网络

1. 在 `client/src/config/networks.ts` 中添加网络配置
2. 在 `server/src/services/blockchain.js` 中添加网络支持
3. 更新相关的类型定义

### 扩展 MPC 协议

1. 在 `server/src/services/mpc.js` 中添加新的协议实现
2. 更新前端组件以支持新的协议流程
3. 添加相应的测试用例

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 许可证

本项目基于 MIT 许可证开源。详情请参阅 [LICENSE](LICENSE) 文件。

## 支持

如有问题或需要帮助，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 提交 [Issue](issues)
3. 参考 [官方文档](https://github.com/coinbase/cb-mpc)

## 致谢

- [Coinbase cb-mpc 库](https://github.com/coinbase/cb-mpc)
- [Ethers.js](https://docs.ethers.io/)
- [React](https://reactjs.org/)
- [Ant Design](https://ant.design/)
