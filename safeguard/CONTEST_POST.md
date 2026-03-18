# 🛡️ YYClaw SafeGuard — AI-Powered BSC Security Agent

## 用 AI 守护你的链上资产，让 BSC 更安全

---

### 🎯 项目简介

**YYClaw SafeGuard** 是一个基于 AI 的 BNB Smart Chain 安全监控 Agent。它能在你买入代币之前，自动检测蜜罐合约、Rug Pull 风险、异常权限，并给出安全评分和建议。

所有 AI 调用通过 **YYClaw Gateway** 完成——一个完全运行在 BSC 链上的 Pay-Per-Call AI 网关，使用 USD1/USDT/USDC 稳定币按次付费，无需订阅，无需 KYC。

**一句话总结：** 粘贴合约地址 → AI 自动扫描 → 告诉你安不安全。

---

### 🔥 核心功能

#### 1. 🍯 蜜罐检测（Honeypot Detection）
- 自动模拟买入/卖出交易
- 检测是否能正常卖出
- 分析买入税和卖出税
- 识别隐藏的转账限制

#### 2. 📝 合约源码 AI 审计
- 从 BscScan 获取已验证的合约源码
- AI 分析合约中的危险函数（mint、pause、blacklist、setFee）
- 检测代理合约（Proxy）风险
- 识别未验证合约（高风险信号）

#### 3. 👤 Owner 权限分析
- 检测合约 Owner 地址
- 分析 Owner 是否有铸币权、暂停权、黑名单权
- 检查 Owner 是否已放弃权限（renounced）

#### 4. 🐋 大额转账监控
- 实时获取最近的代币转账记录
- 识别鲸鱼地址的异常操作
- 检测集中抛售信号

#### 5. 🤖 自然语言安全问答
- 用中文或英文提问
- "这个合约安全吗？"
- "帮我分析一下 0x..."
- "Rug Pull 有哪些常见特征？"

---

### 💡 技术架构

```
用户输入合约地址
        │
        ▼
┌─────────────────────┐
│  YYClaw SafeGuard   │
│  (AI Security Agent)│
└──────────┬──────────┘
           │
     ┌─────┴─────────────────────┐
     │       数据采集层            │
     │                            │
     │  Honeypot.is  ← 蜜罐检测  │
     │  BscScan API  ← 合约源码  │
     │  BSC RPC      ← 链上数据  │
     └──────────┬────────────────┘
                │
                ▼
     ┌────────────────────────┐
     │   YYClaw AI Gateway    │
     │   crypto.yyclaw.cc     │
     │                        │
     │   模型: Gemini 3 Flash │
     │   付费: BSC 链上稳定币  │
     │   方式: approve +      │
     │         transferFrom   │
     └──────────┬─────────────┘
                │
                ▼
          安全分析报告
     (评分 + 风险等级 + 建议)
```

---

### 🚀 使用演示

#### 扫描 PancakeSwap (CAKE) 代币

```bash
$ node agent.js scan 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82

🔍 Scanning: 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82

📋 Token: PancakeSwap Token (CAKE)
🍯 Honeypot: ✅ NO
   Buy Tax: 0% | Sell Tax: 0%
📝 Contract: ✅ Verified (CakeToken)
👤 Owner: 0x73feaa1eE314F8c655E354234017bE2193C9E24E
📊 Recent transfers: 20

🤖 AI Analysis:

Security Score: 92/100
Risk Level: ✅ SAFE

Key Findings:
• Contract verified on BscScan ✅
• No honeypot detected ✅
• 0% buy/sell tax ✅
• Well-known project (PancakeSwap) ✅

Red Flags:
• Owner has minting capability (expected for governance token)

Recommendation: SAFE to interact
```

#### 扫描可疑代币

```bash
$ node agent.js scan 0xSUSPICIOUS_TOKEN_ADDRESS

🔍 Scanning: 0xSUSPICIOUS...

📋 Token: MoonRocket (MOON)
🍯 Honeypot: ⚠️ YES — sell function reverts
   Buy Tax: 5% | Sell Tax: 99%
📝 Contract: ❌ Not verified
👤 Owner: 0x... (not renounced)

🤖 AI Analysis:

Security Score: 8/100
Risk Level: 🔴 CRITICAL

Key Findings:
• HONEYPOT DETECTED — cannot sell ⛔
• 99% sell tax — effectively locks all funds ⛔
• Contract not verified — source code hidden ⛔
• Owner not renounced — can modify contract ⛔

Recommendation: ⛔ AVOID — This is almost certainly a scam
```

#### 交互式聊天

```
🛡️ YYClaw SafeGuard — BSC Security Agent
   Paste a contract address or ask a security question.

You: 什么是蜜罐合约？

🛡️ SafeGuard: 蜜罐合约（Honeypot）是一种常见的 BSC 骗局：
   1. 你可以正常买入代币
   2. 但当你尝试卖出时，交易会失败
   3. 常见手法：sell 函数中加入 revert、设置 99% 卖出税、
      黑名单机制等
   
   防范方法：买入前用 SafeGuard 扫描合约地址 ✅

You: 0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d

🛡️ SafeGuard: Scanning...
   📋 USD1 — Security Score: 95/100 ✅ SAFE
   Verified contract, 0% tax, widely used stablecoin.
```

---

### 🔗 与币安生态的结合

| 维度 | 价值 |
|------|------|
| **保护 BSC 用户** | 在 PancakeSwap 买币前一键检测，减少被骗损失 |
| **链上支付** | 使用 BSC 上的 USD1/USDT/USDC 支付 AI 调用费 |
| **安全教育** | AI 用自然语言解释安全概念，降低新手门槛 |
| **开源共建** | 社区可以贡献新的检测规则和风险模型 |
| **OpenClaw 集成** | 一键安装为 Skill，所有 Agent 自动获得安全检测能力 |

---

### 💰 YYClaw Gateway — 链上 AI 付费基础设施

SafeGuard 背后的 AI 调用由 **YYClaw Gateway** 提供：

- **OpenAI 兼容 API** — 改一行 `base_url` 即可接入
- **20+ AI 模型** — Gemini 2.5/3 Flash/Pro, Claude Haiku/Sonnet/Opus
- **链上计费** — ERC20 `approve` + `transferFrom`，无需充值，代币留在你钱包
- **多链多币** — BSC (USD1/USDT/USDC/U) + Base (USDC/USDT)
- **按次付费** — 最低 $0.01/次，无月费无订阅
- **完全开源** — GitHub: https://github.com/GeniusTimee/yyclaw-tokens

**网站：** https://yyclaw.cc
**API：** https://crypto.yyclaw.cc/v1

---

### 🛠️ 快速开始

```bash
# 克隆项目
git clone https://github.com/GeniusTimee/yyclaw-tokens.git
cd yyclaw-tokens/safeguard

# 安装依赖
npm install

# 配置
export YYCLAW_API_KEY="sk-yy-YOUR_KEY"
export YYCLAW_BASE_URL="https://crypto.yyclaw.cc/v1"
export BSCSCAN_API_KEY="YOUR_BSCSCAN_KEY"

# 扫描代币
node agent.js scan 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82

# 交互式聊天
node agent.js chat
```

---

### 🖼️ 图片素材

**[图1: SafeGuard 架构图]**
> 提示词: A futuristic security shield hologram protecting BNB Smart Chain, showing AI neural network scanning smart contracts, threat detection alerts with green checkmarks and red warnings, honeypot detection visualization, dark cybersecurity theme with gold #F0B90B accents on black #0B0E11 background, holographic data streams flowing through the shield, 16:9 ratio, high detail, professional

**[图2: 扫描结果界面]**
> 提示词: A dark themed terminal/dashboard showing blockchain security scan results, token analysis with security score 92/100 in green, honeypot check passed, contract verified badge, risk level indicators, BNB chain logo, gold and green accent colors on dark background #181A20, monospace font code blocks, professional UI design, 16:9

**[图3: YYClaw Gateway 支付流程]**
> 提示词: An infographic showing Web3 AI payment flow, wallet icon connecting to AI brain icon through blockchain, stablecoins USD1 USDT USDC flowing as payment, BNB Smart Chain and Base chain logos, approve then transferFrom steps visualized, dark theme with gold #F0B90B and green #0ECB81 colors, clean minimal design, 16:9

---

### 📌 参赛信息

- **作品名称：** YYClaw SafeGuard — AI-Powered BSC Security Agent
- **参赛方向：** 安全合规（风控预警、安全监测）+ 开发工具（API 监控）
- **功能亮点：**
  - 🍯 一键蜜罐检测
  - 🤖 AI 合约审计
  - 💰 BSC 链上稳定币付费
  - 🔓 完全开源
  - ⚡ OpenClaw Skill 一键集成
- **演示链接：** https://yyclaw.cc
- **API 端点：** https://crypto.yyclaw.cc/v1
- **GitHub：** https://github.com/GeniusTimee/yyclaw-tokens

---

### 🏷️ Tags

#BinanceAI #OpenClaw #BSCSecurity #Web3Security #AIAgent #YYClaw #BNBChain #DeFiSecurity #HoneypotDetection #SmartContractAudit
