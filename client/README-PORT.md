# 客户端端口配置说明

## 概述

MPC钱包客户端现在支持在启动时自定义端口号，您可以通过多种方式来指定客户端运行的端口。

## 使用方法

### 1. 使用启动脚本（推荐）

在 `client` 目录下，使用以下命令启动并指定端口：

```bash
# 使用默认端口 3000
npm run start:port

# 指定端口号（例如 4000）
npm run start:port -- --port 4000

# 或者使用简写
npm run start:port -- -p 4000
```

### 2. 从项目根目录启动

在项目根目录下：

```bash
# 启动客户端到指定端口
npm run client:port -- --port 4000

# 同时启动服务端和客户端（客户端使用指定端口）
npm run dev:port -- --port 4000
```

### 3. 使用环境变量

您也可以通过设置环境变量来指定端口：

```bash
# Unix/Linux/macOS
PORT=4000 npm start

# Windows (PowerShell)
$env:PORT=4000; npm start

# Windows (CMD)
set PORT=4000 && npm start
```

### 4. 创建 .env 文件

在 `client` 目录下创建 `.env` 文件：

```
PORT=4000
```

然后运行：
```bash
npm start
```

## 端口范围

- 支持的端口范围：1-65535
- 默认端口：3000
- 建议使用：3000-9999 范围内的端口

## 示例

```bash
# 启动到端口 4000
cd client
npm run start:port -- --port 4000

# 或从根目录
npm run client:port -- --port 4000

# 同时启动前后端，前端端口为 5000
npm run dev:port -- --port 5000
```

## 注意事项

1. 确保指定的端口没有被其他应用占用
2. 如果使用代理配置，请确保后端服务器地址正确
3. 某些端口可能需要管理员权限（通常是 1-1023）

## 故障排除

### 端口被占用
如果出现端口被占用的错误，请：
1. 选择其他端口号
2. 或者停止占用该端口的其他应用

### 无法访问应用
1. 检查防火墙设置
2. 确认端口号输入正确
3. 尝试使用默认端口 3000

## 相关配置

客户端默认会代理后端请求到 `http://localhost:8080`，这个配置在 `package.json` 中的 `proxy` 字段中设置。如果后端端口发生变化，请相应更新此配置。 