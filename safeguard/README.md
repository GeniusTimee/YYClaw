# YYClaw SafeGuard — BSC Security Agent

## Overview
YYClaw SafeGuard is an AI-powered security agent for BNB Smart Chain. It analyzes token contracts, detects honeypots, identifies rug pull risks, and monitors suspicious on-chain activity.

## Features
- 🍯 Honeypot detection (buy/sell tax analysis)
- 📝 Contract source verification + AI code audit
- 👤 Owner privilege analysis (mint, pause, blacklist)
- 🐋 Whale transfer monitoring
- 🤖 Natural language security Q&A
- ⚡ Powered by YYClaw AI Gateway (pay-per-call on BSC)

## Quick Start

```bash
# Install dependencies
cd safeguard && npm install

# Set environment
export YYCLAW_API_KEY="sk-yy-YOUR_KEY"
export YYCLAW_BASE_URL="https://crypto.yyclaw.cc/v1"
export BSCSCAN_API_KEY="YOUR_BSCSCAN_KEY"

# Scan a token
node agent.js scan 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82

# Interactive chat
node agent.js chat
```

## Usage Examples

### Scan a Token
```
$ node agent.js scan 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82

🔍 Scanning: 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82

📋 Token: PancakeSwap Token (CAKE)
🍯 Honeypot: ✅ NO
   Buy Tax: 0% | Sell Tax: 0%
📝 Contract: ✅ Verified (CakeToken)
👤 Owner: 0x...
📊 Recent transfers: 20

🤖 AI Analysis:
Security Score: 92/100
Risk Level: SAFE
...
```

### Interactive Chat
```
You: Is 0xdead...beef safe to buy?
🛡️ SafeGuard: Scanning contract... ⚠️ HIGH RISK
   - Honeypot detected: sell function reverts
   - Contract not verified on BscScan
   - Owner can mint unlimited tokens
   Recommendation: AVOID

You: What are common rug pull signs?
🛡️ SafeGuard: Key red flags to watch for:
   1. Unverified contract source code
   2. Owner can mint/pause/blacklist
   3. High sell tax (>10%)
   4. Liquidity not locked
   5. No audit report
   ...
```

## How It Works

```
User Question/Address
        │
        ▼
┌─────────────────┐
│  SafeGuard CLI  │
└────────┬────────┘
         │
    ┌────┴────────────────────────┐
    │         Data Collection      │
    │                              │
    │  ┌──────────┐ ┌───────────┐ │
    │  │ Honeypot │ │ BscScan   │ │
    │  │ API      │ │ API       │ │
    │  └──────────┘ └───────────┘ │
    │  ┌──────────┐ ┌───────────┐ │
    │  │ BSC RPC  │ │ Token     │ │
    │  │ (on-chain│ │ Transfers │ │
    │  └──────────┘ └───────────┘ │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │  YYClaw AI Gateway     │
    │  (Gemini / Claude)     │
    │  crypto.yyclaw.cc/v1   │
    │                        │
    │  Payment: USD1/USDT    │
    │  on BSC via approve +  │
    │  transferFrom          │
    └────────────┬───────────┘
                 │
                 ▼
         Security Report
```

## Binance Ecosystem Value

1. **Protects BSC users** — Instant security checks before buying tokens on PancakeSwap
2. **Reduces scam losses** — AI-powered honeypot and rug pull detection
3. **On-chain payment** — Uses BSC stablecoins (USD1/USDT/USDC), no credit card needed
4. **Open source** — Community can extend and improve detection rules
5. **OpenClaw compatible** — Install as a skill, works with any OpenClaw agent

## Tech Stack

| Component | Technology |
|-----------|-----------|
| AI Models | Gemini 3 Flash / Claude Sonnet (via YYClaw) |
| Blockchain | BSC (BNB Smart Chain) |
| Data Sources | Honeypot.is API, BscScan API, BSC RPC |
| Payment | ERC20 approve + transferFrom (USD1/USDT/USDC) |
| Runtime | Node.js |

## License
MIT
