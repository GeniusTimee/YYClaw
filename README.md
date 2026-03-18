<div align="center">
  <img src="frontend-react/public/icons/yyclaw-logo.png" alt="YYClaw" width="120" />
  <h1>🐾 YYClaw</h1>
  <p><strong>Web3-Native Pay-Per-Call AI Gateway</strong></p>
  <p>Connect wallet → Authorize stablecoins → Call 50+ AI models. No KYC. No subscriptions.</p>

  [![Node.js](https://img.shields.io/badge/Node.js-25+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Chains](https://img.shields.io/badge/Chains-BSC%20%7C%20Base-F0B90B?logo=binance&logoColor=white)](https://bscscan.com)
  [![Models](https://img.shields.io/badge/Models-50+-8B5CF6)](https://crypto.yyclaw.cc/v1/models)
  [![OpenAI Compatible](https://img.shields.io/badge/API-OpenAI%20Compatible-412991?logo=openai&logoColor=white)](https://platform.openai.com/docs/api-reference)
  [![ClawHub](https://img.shields.io/badge/ClawHub-yyclaw-orange)](https://clawhub.com)

  <br />

  🌐 [Live Demo](https://yyclaw.cc) · 📡 [API Endpoint](https://crypto.yyclaw.cc/v1) · 📖 [Docs](https://yyclaw.cc/#docs) · 🛠 [Admin Panel](https://crypto.yyclaw.cc/admin)

  <br />

  <img src="https://img.shields.io/badge/Claude-Opus%20%7C%20Sonnet%20%7C%20Haiku-D97706?style=flat-square" />
  <img src="https://img.shields.io/badge/Gemini-Pro%20%7C%20Flash-4285F4?style=flat-square" />
  <img src="https://img.shields.io/badge/Payment-USD1%20%7C%20USDT%20%7C%20USDC-0ECB81?style=flat-square" />
</div>

<br />

> **TL;DR** — YYClaw is a self-hosted AI API gateway where users pay per call using on-chain stablecoins. One `approve()` transaction, then every API call auto-deducts via `transferFrom`. OpenAI-compatible, zero KYC, instant access.

---

## ✨ Highlights

<table>
<tr>
<td width="50%">

### 🔌 Drop-in Compatible
```python
# Just change 2 lines — works with any OpenAI SDK
client = OpenAI(
    api_key="sk-yy-YOUR_KEY",
    base_url="https://crypto.yyclaw.cc/v1"
)
```

</td>
<td width="50%">

### ⛓️ On-Chain Billing
```
User approves $100 USDT to spender contract
  ↓
Each API call: transferFrom($0.02)
  ↓
Tokens go directly to treasury
  ↓
User can revoke anytime
```

</td>
</tr>
<tr>
<td>

### 🛡️ Charge-After-Success
- Pre-flight: check allowance + balance
- Call upstream AI provider
- Only charge if response succeeds
- Upstream fails = **zero cost**

</td>
<td>

### 🌍 Multi-Chain + Multi-Token
| Chain | Tokens |
|-------|--------|
| BSC | USD1, USDT, USDC, U |
| Base | USDC, USDT |

Auto-selects best token across chains.

</td>
</tr>
</table>

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                       │
│  OpenAI SDK / cURL / OpenClaw Agent / Any HTTP Client   │
└──────────────────────┬──────────────────────────────────┘
                       │ Authorization: Bearer sk-yy-xxx
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   YYClaw Gateway (:6700)                │
│                                                         │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐ │
│  │  Auth    │  │ Billing  │  │  API   │  │  x402     │ │
│  │ /api/auth│  │/api/bill │  │  /v1   │  │ Payment   │ │
│  └────┬────┘  └────┬─────┘  └───┬────┘  └─────┬─────┘ │
│       │            │            │              │        │
│  ┌────┴────────────┴────────────┴──────────────┴─────┐ │
│  │              SQLite (yyclaw.db)                    │ │
│  │  users | models | call_logs | nonces | used_tx    │ │
│  └───────────────────────────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────┴────────────────────────────┐ │
│  │           On-Chain Module (lib/onchain.js)        │ │
│  │  BSC RPC ←→ ERC20 allowance / transferFrom        │ │
│  │  Base RPC ←→ ERC20 allowance / transferFrom       │ │
│  └───────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Upstream AI Providers                       │
│  Anthropic (Claude) / Google (Gemini) / Custom          │
└─────────────────────────────────────────────────────────┘
```

| Component | Port | Description |
|-----------|------|-------------|
| Gateway Server | `:6700` | Main API + frontend + auth + billing |
| Admin Server | `:6701` | Admin panel + model/user management |
| Frontend (React) | served by Gateway | Landing page + user dashboard |
| Admin Frontend (React) | served by Admin | Admin management UI |
| SQLite DB | `yyclaw.db` | All persistent data |

---

## 🚀 Features

| Category | Feature | Status |
|----------|---------|--------|
| **API** | OpenAI-compatible `/v1/chat/completions` | ✅ |
| **API** | SSE streaming support | ✅ |
| **API** | Auto model suffix (`gemini-3-flash` → `gemini-3-flash-fixed`) | ✅ |
| **API** | `/v1/balance` — check credit with API key | ✅ |
| **API** | `/v1/usage` — view call logs with API key | ✅ |
| **Auth** | Web3 wallet login (EIP-191 signature) | ✅ |
| **Auth** | MetaMask, OKX, Binance Web3 Wallet, WalletConnect | ✅ |
| **Billing** | On-chain ERC20 `transferFrom` auto-deduction | ✅ |
| **Billing** | Pre-flight allowance + balance check | ✅ |
| **Billing** | Charge-after-success (upstream fails = no charge) | ✅ |
| **Billing** | x402 protocol support | ✅ |
| **Chain** | BSC (Chain ID: 56) | ✅ |
| **Chain** | Base (Chain ID: 8453) | ✅ |
| **Token** | USD1, USDT, USDC, U (BSC) / USDC, USDT (Base) | ✅ |
| **Frontend** | Landing page with particle animation | ✅ |
| **Frontend** | User dashboard (API key, stats, approve, logs) | ✅ |
| **Frontend** | 🌐 i18n — English / 中文 toggle | ✅ |
| **Frontend** | Auto-select token with balance + MAX button | ✅ |
| **Frontend** | Binance Wallet recommended highlight | ✅ |
| **Admin** | Model CRUD + upstream config | ✅ |
| **Admin** | User management + usage analytics | ✅ |
| **Skill** | OpenClaw Skill — one-command install | ✅ |
| **Infra** | Zero external DB — SQLite only | ✅ |
| **Infra** | Single `node` binary — no build tools for backend | ✅ |
| **Contract** | `YYClawSpender.sol` — deployed on BSC + Base | ✅ |

---

## 🤖 Supported Models

<details>
<summary><strong>Google Gemini (10 models)</strong></summary>

| Model | Price/Call |
|-------|-----------|
| `gemini-2.5-flash` | $0.010 |
| `gemini-3-flash` | $0.020 |
| `gemini-3-flash-agent` | $0.020 |
| `gemini-3-flash-preview` | $0.030 |
| `gemini-2.5-pro` | $0.060 |
| `gemini-3.1-pro-high` | $0.060 |
| `gemini-3-pro-preview` | $0.080 |
| `gemini-3-pro-preview-thinking` | $0.080 |
| `gemini-3-pro-preview-thinking-128` | $0.080 |
| `gemini-3.1-flash-image` | $0.200 |

</details>

<details>
<summary><strong>Anthropic Claude (10 models)</strong></summary>

| Model | Price/Call |
|-------|-----------|
| `claude-haiku-4.5` | $0.064 |
| `claude-haiku-4.5-thinking` | $0.064 |
| `claude-sonnet-4` | $0.100 |
| `claude-sonnet-4-thinking` | $0.100 |
| `claude-sonnet-4-6` | $0.100 |
| `claude-sonnet-4.5` | $0.100 |
| `claude-sonnet-4.5-thinking` | $0.100 |
| `claude-opus-4.6` | $0.160 |
| `claude-opus-4-6-thinking` | $0.160 |

</details>

> Model names are sent without the `-fixed` suffix. The gateway appends it automatically.

---

## 💰 Supported Tokens

### BSC (BNB Smart Chain — Chain ID: 56)

| Token | Contract | Decimals |
|-------|----------|----------|
| USD1 | [`0x8d0d...08b0d`](https://bscscan.com/token/0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d) | 18 |
| USDT | [`0x55d3...7955`](https://bscscan.com/token/0x55d398326f99059ff775485246999027b3197955) | 18 |
| USDC | [`0x8ac7...580d`](https://bscscan.com/token/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d) | 18 |
| U | [`0xcE24...6666`](https://bscscan.com/token/0xcE24439F2D9C6a2289F741120FE202248B666666) | 18 |

### Base (Chain ID: 8453)

| Token | Contract | Decimals |
|-------|----------|----------|
| USDC | [`0x8335...2913`](https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) | 6 |
| USDT | [`0xfde4...b2`](https://basescan.org/token/0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2) | 6 |

### Smart Contracts

| Contract | BSC | Base |
|----------|-----|------|
| YYClawSpender | [`0x530e...d173`](https://bscscan.com/address/0x30E57026c87072CFAc5B543bEA19ae1850D9bE68) | [`0x0425...90b4B`](https://basescan.org/address/0x30E57026c87072CFAc5B543bEA19ae1850D9bE68) |

---

## ⚡ Quick Start

### Prerequisites

- Node.js ≥ 25 (uses `node:sqlite` built-in module)
- A funded EVM wallet private key (for `transferFrom` execution)

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/yyclaw.git
cd yyclaw
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

```env
PORT=6700
ADMIN_PORT=6701
JWT_SECRET=your-secure-random-secret
ADMIN_KEY=your-admin-password
SPENDER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

### 3. Start

```bash
./start.sh
# Gateway → http://localhost:6700
# Admin   → http://localhost:6701
```

### 4. Configure Models

Open admin panel → add upstream providers (API keys, URLs, model mappings).

### 5. Test

```bash
# List models
curl http://localhost:6700/v1/models

# Make a call
curl http://localhost:6700/v1/chat/completions \
  -H "Authorization: Bearer sk-yy-YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-3-flash","messages":[{"role":"user","content":"Hello"}]}'
```

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `PORT` | | `6700` | Gateway server port |
| `ADMIN_PORT` | | `6701` | Admin panel port |
| `JWT_SECRET` | ✅ | — | Secret for JWT signing |
| `ADMIN_KEY` | ✅ | — | Admin panel password |
| `SPENDER_PRIVATE_KEY` | ✅ | — | Hot wallet key for `transferFrom` |

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/auth/nonce?address=0x...` | — | Get login nonce |
| `POST` | `/api/auth/verify` | — | Verify signature → JWT + API key |
| `GET` | `/api/auth/me` | JWT | Get current user |

### AI Models (OpenAI-Compatible)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/v1/chat/completions` | API Key | Chat completion (streaming supported) |
| `GET` | `/v1/models` | — | List all enabled models |

### Billing (API Key)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/v1/balance` | API Key | On-chain balance + spent + remaining |
| `GET` | `/v1/usage?limit=20` | API Key | Call logs + stats |

### Billing (JWT)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/billing/balance` | JWT | Total on-chain allowance |
| `GET` | `/api/billing/logs` | JWT | Last 50 call logs |
| `GET` | `/api/billing/stats` | JWT | Aggregated usage stats |

### Error Codes

| Status | Type | Description |
|--------|------|-------------|
| `401` | `auth_error` | Missing or invalid API key |
| `402` | `payment_error` | Insufficient allowance or balance |
| `404` | `invalid_request` | Model not found |
| `503` | `service_error` | Model upstream not configured |

<details>
<summary><strong>402 Response Example</strong></summary>

```json
{
  "error": {
    "message": "Insufficient allowance or balance. Approve tokens to the spender address first.",
    "type": "payment_error",
    "required": 0.02,
    "hint": "Approve tokens on BSC or Base, then retry."
  }
}
```

</details>

---

## 💳 Payment Flow

```
User Wallet                    YYClaw Backend                 Upstream AI
     │                              │                              │
     │  1. approve(spender, $100)   │                              │
     │  (one-time on-chain tx)      │                              │
     │──────────────────────────────│                              │
     │                              │                              │
     │  2. POST /v1/chat/completions│                              │
     │─────────────────────────────>│                              │
     │                              │  3. Check allowance+balance  │
     │                              │  4. Forward to upstream ────>│
     │                              │  5. Receive response <───────│
     │                              │  6. transferFrom($0.02) ───> │
     │  7. Return AI response       │                              │
     │<─────────────────────────────│                              │
```

**Key properties:**
- ✅ Pre-flight check — 402 before wasting upstream calls
- ✅ Charge-after-success — upstream fails = no charge
- ✅ Auto token selection — tries BSC first, then Base, picks best token
- ✅ Revocable — user can revoke approval anytime

---

## 🖥️ Frontend

Built with React 18 + Vite + wagmi v2.

| Feature | Description |
|---------|-------------|
| Landing page | Particle animation, features, pricing, docs |
| Dashboard | API key, stats, approve panel, call logs |
| i18n | English / 中文 toggle (right corner) |
| Wallet modal | Binance (recommended), MetaMask, OKX, WalletConnect |
| Auto-select | Picks first token with balance, fills MAX amount |

### Build

```bash
cd frontend-react && npm install && npm run build
# → ../frontend-dist/ (served by gateway)
```

---

## 🛠 Admin Panel

Access at `:6701` or `:6700/admin`. Protected by `X-Admin-Key` header.

| Feature | Description |
|---------|-------------|
| Models | CRUD + upstream config (URL, key, model mapping, price) |
| Users | Wallet addresses, API keys, balances |
| Logs | Real-time call log viewer with status |
| Stats | Revenue charts, call volume, user count |

---

## 🔗 OpenClaw Skill

One-command install for any OpenClaw agent:

### Install

```bash
# Option A: ClawHub
clawhub install yyclaw

# Option B: GitHub
git clone https://github.com/GeniusTimee/yyclaw-skill ~/.openclaw/workspace/skills/yyclaw

# Option C: Manual
cp -r skill/ ~/.openclaw/workspace/skills/yyclaw
```

### Configure

```yaml
# ~/.openclaw/config.yaml
providers:
  yyclaw:
    url: https://crypto.yyclaw.cc/v1
    key: sk-yy-YOUR_KEY
    models: [gemini-3-flash, claude-sonnet-4-6, claude-opus-4.6]

default_model: yyclaw/gemini-3-flash
```

### Natural Language Commands

- `"check my yyclaw balance"` → `GET /v1/balance`
- `"list yyclaw models"` → `GET /v1/models`
- `"use yyclaw to call gemini-3-flash with: ..."` → `POST /v1/chat/completions`
- `"show my yyclaw usage"` → `GET /v1/usage`

---

## 📦 SDK Integration

YYClaw is 100% OpenAI-compatible. Change `base_url` and you're done.

<details>
<summary><strong>Python</strong></summary>

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-yy-YOUR_KEY",
    base_url="https://crypto.yyclaw.cc/v1"
)

response = client.chat.completions.create(
    model="gemini-3-flash",
    messages=[{"role": "user", "content": "Hello"}]
)
print(response.choices[0].message.content)
```

</details>

<details>
<summary><strong>Node.js</strong></summary>

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-yy-YOUR_KEY',
  baseURL: 'https://crypto.yyclaw.cc/v1'
});

const res = await client.chat.completions.create({
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user', content: 'Hello!' }]
});
console.log(res.choices[0].message.content);
```

</details>

<details>
<summary><strong>cURL</strong></summary>

```bash
curl https://crypto.yyclaw.cc/v1/chat/completions \
  -H "Authorization: Bearer sk-yy-YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-3-flash","messages":[{"role":"user","content":"Hello"}]}'
```

</details>

<details>
<summary><strong>Global Environment Override</strong></summary>

```bash
# Every OpenAI-compatible tool uses YYClaw
export OPENAI_API_KEY="sk-yy-YOUR_KEY"
export OPENAI_BASE_URL="https://crypto.yyclaw.cc/v1"
```

Works with: `openai` CLI, `codex`, `aider`, `continue`, `cursor`, `llm`, LangChain, LlamaIndex.

</details>

---

## 🏗️ Project Structure

```
YYClaw/
├── server.js              # Gateway server (Express)
├── admin-server.js        # Admin panel server
├── db.js                  # SQLite init + model seeding
├── start.sh / stop.sh     # Process management
│
├── routes/
│   ├── api.js             # /v1/* (completions, models, balance, usage)
│   ├── auth.js            # /api/auth/* (nonce, verify, me)
│   ├── billing.js         # /api/billing/* (balance, logs, stats)
│   ├── admin.js           # /admin/api/* (models, users, stats)
│   └── x402.js            # x402 payment middleware
│
├── lib/
│   └── onchain.js         # ERC20 transferFrom, allowance, auto-charge
│
├── contracts/
│   ├── YYClawSpender.sol  # Spender contract (Solidity ^0.8.20)
│   ├── deploy.js          # Multi-chain deployment script
│   ├── deployment-bsc.json
│   └── deployment-base.json
│
├── skill/
│   └── SKILL.md           # OpenClaw Skill definition
│
├── frontend-react/        # User SPA (React + Vite + wagmi)
├── frontend-dist/         # Built frontend
├── admin-react/           # Admin SPA (React + Vite)
├── admin-dist/            # Built admin
├── safeguard/             # Contest submission tools
└── docs/                  # Full documentation
```

---

## 🔒 Security

| Layer | Mechanism |
|-------|-----------|
| Auth | EIP-191 wallet signature, single-use nonces, 7-day JWT |
| API Keys | Server-generated `sk-yy-*`, one per wallet |
| On-Chain | `transferFrom` only — spender can't move unapproved tokens |
| Revocation | Users revoke approval anytime (dashboard or on-chain) |
| Admin | `X-Admin-Key` header, restrict to internal network |
| DB | SQLite — no external DB credentials to leak |

---

## 📋 Deployment

<details>
<summary><strong>Production Checklist</strong></summary>

- [ ] Strong `JWT_SECRET` and `ADMIN_KEY`
- [ ] Dedicated hot wallet for `SPENDER_PRIVATE_KEY`
- [ ] Fund spender with gas (BNB on BSC, ETH on Base)
- [ ] HTTPS via nginx/Caddy reverse proxy
- [ ] Configure upstream models in admin panel
- [ ] Build frontends: `cd frontend-react && npm run build`
- [ ] `proxy_buffering off` in nginx for SSE streaming

</details>

<details>
<summary><strong>Nginx Config</strong></summary>

```nginx
server {
    listen 443 ssl http2;
    server_name crypto.yyclaw.cc;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:6700;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 120s;
        proxy_buffering off;
    }
}
```

</details>

<details>
<summary><strong>systemd Service</strong></summary>

```ini
[Unit]
Description=YYClaw AI Gateway
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/yyclaw
ExecStart=/usr/bin/node --experimental-sqlite server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

</details>

<details>
<summary><strong>Docker</strong></summary>

```dockerfile
FROM node:25-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 6700
CMD ["node", "--experimental-sqlite", "server.js"]
```

</details>

---

## 🗄️ Database Schema

<details>
<summary><strong>View Schema</strong></summary>

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT UNIQUE NOT NULL,
  balance REAL DEFAULT 0,
  api_key TEXT UNIQUE,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  upstream_url TEXT DEFAULT '',
  upstream_key TEXT DEFAULT '',
  upstream_model TEXT DEFAULT '',
  price_per_call REAL NOT NULL,
  enabled INTEGER DEFAULT 1
);

CREATE TABLE call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  model TEXT,
  cost REAL,
  status TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE nonces (
  address TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
```

</details>

---

## 📄 License

MIT

---

<div align="center">
  <br />
  <strong>YYClaw</strong> — The fastest way to access AI models with crypto.
  <br />
  <sub>Built with ❤️ and stablecoins.</sub>
  <br /><br />
  <a href="https://yyclaw.cc">Website</a> · <a href="https://crypto.yyclaw.cc/v1/models">API</a> · <a href="https://github.com/GeniusTimee/yyclaw-skill">Skill</a>
</div>
