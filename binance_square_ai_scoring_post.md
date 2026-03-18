# 币安广场参赛帖 — YYClaw

## 标题

`YYClaw：基于 BSC 的 Web3 原生 AI Gateway，用稳定币按次调用 50+ AI 模型`

## 正文

YYClaw：基于 BSC 的 Web3 原生 AI Gateway，用稳定币按次调用 50+ AI 模型

---

### 一、这个项目解决什么问题？

现在调用 AI 模型（Claude、Gemini 等），开发者必须：绑信用卡 → 月付订阅 → 中心化结算。

这对 Web3 开发者来说很不自然。链上应用、交易机器人、Agent 工作流需要的是：**用链上资产按次付费，调完即走，随时可撤**。

YYClaw 就是为此而生 —— 一个部署在 BSC 上的 AI API Gateway：

- 连接钱包，授权稳定币（USD1 / USDT / USDC）
- 每次 API 调用自动从链上扣费（`transferFrom`）
- 完全兼容 OpenAI SDK，改两行代码即可接入
- 随时可在链上撤销授权，资金始终在用户钱包

---

### 二、它是怎么工作的？

**完整链路已跑通，不是概念 Demo：**

```
连接钱包 → 签名登录 → 授权稳定币 → 获取 API Key → 调用 AI → 链上自动扣费 → Dashboard 查看用量
```

**核心流程：**

1. 用户在 BSC 上 `approve()` 稳定币给 YYClawSpender 合约
2. 程序通过 `POST /v1/chat/completions` 调用 AI（OpenAI 兼容）
3. Gateway 先检查链上 allowance + balance（不够直接返回 402）
4. 转发请求到上游 AI 供应商（Anthropic / Google）
5. 上游成功返回后，才执行 `transferFrom` 扣费
6. 上游失败 = 不扣费，零风险

**关键设计：Charge-After-Success**
- 先调用，后扣费
- 上游报错不收钱
- 预检查避免浪费请求

---

### 三、技术实现

#### 3.1 智能合约

`YYClawSpender.sol`（Solidity ^0.8.20，solc 0.8.34 编译，optimizer 200 runs）

- 已部署 BSC：[0x30E57026c87072CFAc5B543bEA19ae1850D9bE68](https://bscscan.com/address/0x30E57026c87072CFAc5B543bEA19ae1850D9bE68)
- 已部署 Base：[0x30E57026c87072CFAc5B543bEA19ae1850D9bE68](https://basescan.org/address/0x30E57026c87072CFAc5B543bEA19ae1850D9bE68)

合约功能：
- `collectPayment()` — operator 调用，从用户钱包 transferFrom 到 treasury
- `checkPayable()` — 预检查 allowance + balance
- `setOperator()` / `setTreasury()` / `transferOwnership()` — 管理函数
- 仅 operator 可执行扣费，用户可随时 revoke

#### 3.2 后端 Gateway

- Node.js + Express + SQLite（零外部数据库依赖）
- OpenAI 兼容 API：`/v1/chat/completions`、`/v1/models`
- 钱包签名登录（EIP-191）
- API Key 认证（`sk-yy-*`）
- 链上余额查询：`/v1/balance`（API Key 直接查，无需 JWT）
- 用量日志：`/v1/usage`
- 自动选择最优代币和链进行扣费

#### 3.3 前端

- React 18 + Vite + wagmi v2
- 钱包连接：Binance Web3 Wallet（推荐）、MetaMask、OKX、WalletConnect
- 中英文切换（i18n）
- 自动选中有余额的代币，默认填充最大授权额度
- Dashboard：API Key、余额、用量统计、授权管理、调用日志、接入文档

#### 3.4 Admin 后台

- 模型 CRUD（上游 URL、Key、定价、开关）
- 用户管理
- 收入统计 + 调用日志

#### 3.5 支持的代币

| 链 | 代币 |
|---|------|
| BSC | USD1、USDT、USDC、U |
| Base | USDC、USDT |

#### 3.6 支持的模型（20+）

| 供应商 | 模型 | 单次价格 |
|--------|------|---------|
| Google | gemini-2.5-flash | $0.010 |
| Google | gemini-3-flash | $0.020 |
| Google | gemini-3-pro-preview | $0.080 |
| Anthropic | claude-haiku-4.5 | $0.064 |
| Anthropic | claude-sonnet-4-6 | $0.100 |
| Anthropic | claude-opus-4.6 | $0.160 |
| ... | 共 20+ 模型 | $0.01 ~ $0.20 |

---

### 四、谁会用它？

YYClaw 不是给个人聊天用的 AI Bot，而是一层**基础设施**，让各种程序接入 AI：

| 场景 | 怎么用 |
|------|--------|
| 交易机器人 | 调用 AI 分析市场情绪、生成策略注释 |
| 量化研究 | AI 解读链上数据、生成研报 |
| Agent 工作流 | 多 Agent 编排，按任务按次消耗 AI |
| 开发者工具 | IDE 插件、代码助手、文档生成 |
| 客服系统 | 自动问答、工单分类 |
| 内容生成 | 社交媒体、营销文案 |

**迁移成本极低** —— 任何用 OpenAI SDK 的程序，改两行代码：

```python
client = OpenAI(
    api_key="sk-yy-YOUR_KEY",
    base_url="https://crypto.yyclaw.cc/v1"
)
```

---

### 五、OpenClaw Skill 生态集成

YYClaw 已发布为 OpenClaw Skill，任何 OpenClaw Agent 一键安装即可使用：

```bash
# ClawHub 安装
clawhub install yyclaw

# 或 GitHub 安装
git clone https://github.com/GeniusTimee/yyclaw-skill ~/.openclaw/workspace/skills/yyclaw
```

安装后 Agent 可以直接用自然语言操作：
- "查看 yyclaw 余额"
- "用 yyclaw 调用 gemini-3-flash"
- "显示 yyclaw 用量"

---

### 六、在线体验

所有功能已上线，可直接体验完整链路：

- 🌐 官网：https://yyclaw.cc
- 📡 API：https://crypto.yyclaw.cc/v1
- 🛠 Admin：https://crypto.yyclaw.cc/admin
- 📦 Skill：https://github.com/GeniusTimee/yyclaw-skill
- 📄 合约（BSC）：https://bscscan.com/address/0x30E57026c87072CFAc5B543bEA19ae1850D9bE68

**体验步骤：**
1. 打开 yyclaw.cc → Connect Wallet（推荐 Binance Web3 Wallet）
2. 签名登录 → 选择 BSC 链 + USD1/USDT/USDC → Approve
3. 进入 Dashboard → 复制 API Key
4. 用任意 OpenAI SDK 调用 → Dashboard 实时查看扣费日志

---

### 七、与评分维度的对应

#### 实用性（30%）
- 解决真实问题：让 Web3 程序用链上资产按次调用 AI
- 面向多场景：交易、研究、Agent、开发工具、客服
- OpenAI 兼容，迁移成本接近零
- 已上线可用，不是概念 Demo

#### 创意性（25%）
- 首个将 BSC + 稳定币 + X402 按量计费 + OpenAI 兼容 API 整合的 AI Gateway
- Charge-After-Success 模式：先用后付，失败不扣
- 链上 approve/revoke 机制让用户完全掌控资金
- OpenClaw Skill 生态集成，Agent 一键接入

#### 完成度（25%）
- 智能合约已部署双链（BSC + Base），已验证
- 后端 Gateway 完整运行（API + Auth + Billing + Admin）
- 前端 Landing + Dashboard 完整上线（中英文）
- OpenClaw Skill 已发布 ClawHub + GitHub
- 完整文档（API Reference、SDK Integration、Deployment Guide）
- 端到端链路已跑通：钱包 → 授权 → 调用 → 扣费 → 日志

#### 技术性（10%）
- Solidity 智能合约（YYClawSpender）
- EIP-191 钱包签名认证
- 链上 ERC20 allowance + transferFrom 自动扣费
- 多链多代币自动选择最优支付路径
- SSE 流式响应支持
- SQLite 零依赖架构

#### 可读性（10%）
- 结构化分节，问题 → 方案 → 技术 → 场景 → 体验 → 评分对应
- 代码示例简洁明了
- 合约地址、API 链接、GitHub 均可直接验证
- 中英文双语支持

---

### 配图建议

建议搭配 4 张图提升完成度评分：

1. **系统流程图** — 钱包 → 授权 → API 调用 → 链上扣费 → Dashboard
2. **架构图** — 五层架构（接入层 / 身份支付层 / Gateway / 模型层 / 数据层）
3. **场景矩阵图** — 交易、研究、Agent、开发工具、客服等接入场景
4. **Dashboard 截图** — 实际运行的 Dashboard 界面

### 配图提示词

#### 图 1 系统流程图
```
Create a clean system flow diagram for a web3 AI gateway. Flow: wallet connection → BSC stablecoin approval → API key issuance → OpenAI-compatible API call → on-chain transferFrom payment → dashboard logs. Dark background, Binance yellow (#F0B90B) accents, minimal cards, elegant arrows, modern infographic, no watermark, 4:5 vertical.
```

#### 图 2 五层架构图
```
Create a layered architecture infographic for a BSC AI gateway. Five layers: access layer (SDK/web/API), identity & payment layer (wallet + stablecoin), AI gateway layer (routing + metering), model layer (Claude/Gemini), analytics layer (logs + dashboard). Dark fintech style, black and gold, blockchain network lines, no watermark, 4:5 vertical.
```

#### 图 3 场景矩阵图
```
Create an infographic showing multiple programs connecting to a BSC AI gateway: trading bots, research tools, customer service, IDE plugins, agent workflows, automation scripts. Dark premium style, Binance yellow highlights, clean grid layout, futuristic elements, no text, no watermark, 4:5 vertical.
```

#### 图 4 Dashboard 截图
直接截取 https://yyclaw.cc/dashboard 的实际界面。
