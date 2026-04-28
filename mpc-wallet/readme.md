# MPC Wallet — 三方分布式门限钱包演示

本项目是一个基于 **Pedersen DKG + Feldman VSS + TSS** 的 MPC（安全多方计算）钱包教学演示。通过三个独立的浏览器窗口模拟三个参与方，完整展示"密钥分布式生成 → 地址派生 → 门限签名"的全过程，期间完整私钥永不出现。

---

## 核心功能

| 功能 | 说明 |
|------|------|
| **Pedersen DKG** | 三方各自生成随机多项式，通过 Feldman VSS 分发 shares，最终聚合出各自的私钥分片 |
| **Feldman VSS** | 可验证的秘密分享，接收方可以独立验证分片合法性，无需信任发送方 |
| **BIP-44 HD 派生** | 基于 MPC 主公钥做公钥侧 BIP-44 派生，生成标准路径 `m/44'/60'/0'/0/N` 的收款地址 |
| **xpub 编码** | 将 MPC 主公钥 + 链码编码为标准 xpub 格式，可导入其他钱包工具做地址监控 |
| **TSS 门限签名** | 任意两方协作完成 ECDSA 签名，无需重建完整私钥 |

---

## 项目结构

```
src/
├── field.js          # 有限域运算、secp256k1 点运算、地址生成
├── vss.js            # Feldman VSS：多项式生成、分片、验证、拉格朗日插值
├── dkg.js            # Pedersen DKG 协议编排（封装 vss.js 的调用流程）
├── tss.js            # 门限签名协议：加法分享转换、两轮签名交互、验签
├── hdwallet.js       # BIP-32/44 公钥侧派生、xpub 编解码、 tweak 应用
├── transaction.js    # ETH 交易构造与序列化（支持普通转账和 ERC-20）
├── wallet.js         # 高阶钱包 API：整合 DKG + HD + TSS 的完整流程
└── server.js         # 各参与方的 HTTP 服务，提供 DKG/TSS/HD 的 REST 接口

index.html            # 前端交互页面，逐步引导完成 DKG → HD → TSS
start.sh              # 一键启动三个参与方服务
```

---

## 模块逻辑关系

```
┌─────────────────────────────────────────────────────────────┐
│                        用户交互层                            │
│                     index.html (前端)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────┐
│                     server.js                                │
│  ├─ /dkg/phase1   生成多项式 + Feldman 承诺                  │
│  ├─ /dkg/phase2   接收并验证其他方分片                       │
│  ├─ /dkg/phase3   聚合分片 → 私钥分片 + 全局公钥             │
│  ├─ /hd/derive    公钥侧 BIP-44 派生收款地址                 │
│  ├─ /tss/init     发起方 A：生成 nonce R_A                  │
│  ├─ /tss/respond  协作方 B：计算签名贡献                     │
│  └─ /tss/finalize 发起方 A：聚合 → 完整签名                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    ▼                  ▼                  ▼
┌─────────┐      ┌─────────┐      ┌─────────────┐
│  dkg.js │      │  tss.js │      │ hdwallet.js │
│(协议编排)│      │(签名逻辑)│      │(HD 派生逻辑)│
└────┬────┘      └────┬────┘      └──────┬──────┘
     │                │                   │
     └────────────────┼───────────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌──────────┐
    │  vss.js │  │ field.js│  │transaction.js
    │(多项式) │  │(椭圆曲线)│  │(交易构造)  │
    └─────────┘  └─────────┘  └──────────┘
```

---

## 关于 HD 钱包实现的说明

本项目未直接引用 `bip32` 等现有 HD 库，而是在 `hdwallet.js` 中自行实现了核心派生逻辑。原因如下：

1. **MPC 需要暴露内部 tweak**
   标准 `bip32` 库只返回最终派生的公钥/私钥，但 MPC 签名要求将每一层的 `tweak` 暴露出来，让各方在本地将 tweak 加到自己的私钥分片上（`applyTweaksToKeyShare`）。现有库不会暴露这个中间值。

2. **公钥侧派生 + 分片调整是定制流程**
   BIP-32 库通常设计为"传入母私钥 → 返回子私钥"或"传入母公钥 → 返回子公钥"。但 MPC 的流程是：服务端只持有公钥和链码做公钥侧派生；签名时各方在本地用同样的 tweak 调整自己的**分片**，然后用调整后的分片参与 TSS 签名。这种组合逻辑没有现成库支持。

3. **教学目的**
   自己实现可以让读者直接看到 `HMAC-SHA512 → IL / IR → 公钥 + tweak·G` 的每一步，而不是藏在库的抽象后面。代码注释也明确说明："本实现简化了 BIP-32 的链码管理，聚焦展示核心派生逻辑。"

4. **依赖最小化**
   项目仅依赖 `@noble/curves` + `@noble/hashes` 做底层椭圆曲线和哈希运算，不引入 `bip32`、`bitcoinjs-lib` 等更大的包，降低了教学项目的理解和构建门槛。

---

## 技术要点

### BIP-44 路径格式

MPC 主公钥在语义上对应 BIP-44 的 account 层（`m/44'/60'/0'`），公钥侧仅派生最后两层：

```
m / 44' / 60' / 0' / change / address_index
   ───── 硬化层（DKG 前完成）─────   ── 公钥侧派生 ──
```

- `change = 0`：外部/收款地址
- `change = 1`：内部/找零地址（BTC 场景）

### xpub 扩展公钥

DKG 完成后，系统将 MPC 主公钥 + 链码编码为标准 **xpub**（Base58Check），格式与 BIP-32 完全兼容：

```
xpub = Base58Check(version + depth + fingerprint + childIndex + chainCode + publicKey)
```

任意支持 xpub 的钱包（如 MetaMask、Electrum）可导入该 xpub 做地址监控，但无法花费资金——因为没有私钥。

---

## 快速启动

```bash
# 安装依赖
npm install

# 启动三个参与方（端口 3001 / 3002 / 3003）
npm start

# 或分别启动
node src/server.js 1 3001
node src/server.js 2 3002
node src/server.js 3 3003
```

打开三个浏览器窗口分别访问：
- http://localhost:3001
- http://localhost:3002
- http://localhost:3003

按页面引导依次执行 **DKG 阶段 1 → 阶段 2 → 阶段 3 → HD 派生 → TSS 签名**。

---

## 依赖

- Node.js >= 18
- [@noble/curves](https://github.com/paulmillr/noble-curves) — secp256k1 椭圆曲线
- [@noble/hashes](https://github.com/paulmillr/noble-hashes) — SHA-256 / SHA-512 / HMAC / Keccak
- [express](https://expressjs.com/) — Web 服务框架
