<![CDATA[<div align="center">
  <img src="frontend-react/public/icons/yyclaw-logo.png" alt="YYClaw" width="120" />
  <h1>YYClaw</h1>
  <p><strong>Web3-Native Pay-Per-Call AI Gateway</strong></p>
  <p>Connect wallet → Authorize stablecoins → Call 50+ AI models. No KYC. No subscriptions.</p>

  ![Node.js](https://img.shields.io/badge/Node.js-25+-339933?logo=node.js)
  ![License](https://img.shields.io/badge/License-MIT-blue)
  ![Chains](https://img.shields.io/badge/Chains-BSC%20%7C%20Base-yellow)
</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Supported Models](#supported-models)
- [Supported Tokens](#supported-tokens)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Payment Flow](#payment-flow)
- [Frontend](#frontend)
- [Admin Panel](#admin-panel)
- [OpenClaw Skill Integration](#openclaw-skill-integration)
- [SDK Integration](#sdk-integration)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

YYClaw is a self-hosted AI API gateway that provides:

- **OpenAI-compatible API** — drop-in replacement, change `base_url` and you're done
- **Web3 wallet authentication** — sign-in with MetaMask/OKX, no passwords
- **On-chain pay-per-call** — pre-authorize ERC20 stablecoins, auto-deducted per API call via `transferFrom`
- **Multi-chain support** — BSC (BNB Chain) and Base
- **Multi-token support** — USD1, USDT, USDC, USDbC, U
- **Admin panel** — model management, user management, usage analytics
- **OpenClaw Skill** — one-click integration for all OpenClaw agents

## Architecture

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
│  │  BSC RPC ←→ ERC20 allowance/transferFrom          │ │
│  │  Base RPC ←→ ERC20 allowance/transferFrom         │ │
│  └───────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Upstream AI Providers                       │
│  Anthropic (Claude) / Google (Gemini) / Custom          │
└─────────────────────────────────────────────────────────┘
```

**Components:**

| Component | Port | Description |
|-----------|------|-------------|
| Gateway Server | `:6700` | Main API + frontend + auth + billing |
| Admin Server | `:6701` | Admin panel + model/user management |
| Frontend (React) | served by Gateway | Landing page + user dashboard |
| Admin Frontend (React) | served by Admin | Admin management UI |
| SQLite DB | `yyclaw.db` | All persistent data |

## Features

- ✅ **OpenAI-compatible API** — `/v1/chat/completions` and `/v1/models`
- ✅ **Streaming support** — SSE streaming for real-time responses
- ✅ **Web3 wallet login** — EIP-191 signature verification (MetaMask, OKX, WalletConnect)
- ✅ **On-chain billing** — ERC20 `transferFrom` auto-deduction, no pre-deposit needed
- ✅ **Multi-chain** — BSC (Chain ID: 56) + Base (Chain ID: 8453)
- ✅ **Multi-token** — USD1, USDT, USDC, USDbC, U (all stablecoins)
- ✅ **Auto model suffix** — send `gemini-3-flash`, we map to `gemini-3-flash-fixed` internally
- ✅ **Pre-flight balance check** — verify allowance + balance before calling upstream (no wasted calls)
- ✅ **Charge-after-success** — upstream fails = no charge
- ✅ **x402 protocol support** — standard HTTP 402 payment flow
- ✅ **Admin panel** — CRUD models, manage users, view logs, top-up balances
- ✅ **OpenClaw Skill** — one-command install for all agents
- ✅ **Zero dependencies on external DBs** — SQLite only, no MySQL/Postgres required
- ✅ **Single `node` binary** — no build tools required for backend

## Supported Models

| Model | Provider | Price/Call |
|-------|----------|-----------|
| `gemini-2.5-flash` | Google | $0.010 |
| `gemini-3-flash` | Google | $0.020 |
| `gemini-3-flash-agent` | Google | $0.020 |
| `gemini-3-flash-preview` | Google | $0.030 |
| `gemini-2.5-pro` | Google | $0.060 |
| `gemini-3.1-pro-high` | Google | $0.060 |
| `gemini-3-pro-preview` | Google | $0.080 |
| `gemini-3-pro-preview-thinking` | Google | $0.080 |
| `gemini-3-pro-preview-thinking-128` | Google | $0.080 |
| `gemini-3-pro-preview-thinking-512` | Google | $0.080 |
| `gemini-3.1-flash-image` | Google | $0.200 |
| `claude-haiku-4.5` | Anthropic | $0.064 |
| `claude-haiku-4.5-thinking` | Anthropic | $0.064 |
| `claude-sonnet-4` | Anthropic | $0.100 |
| `claude-sonnet-4-thinking` | Anthropic | $0.100 |
| `claude-sonnet-4-6` | Anthropic | $0.100 |
| `claude-sonnet-4.5` | Anthropic | $0.100 |
| `claude-sonnet-4.5-thinking` | Anthropic | $0.100 |
| `claude-opus-4.6` | Anthropic | $0.160 |
| `claude-opus-4-6-thinking` | Anthropic | $0.160 |

> Model names are sent without the `-fixed` suffix. The gateway appends it automatically.

## Supported Tokens

### BSC (BNB Smart Chain — Chain ID: 56)

| Token | Contract Address | Decimals |
|-------|-----------------|----------|
| USD1 | `0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d` | 18 |
| USDT | `0x55d398326f99059ff775485246999027b3197955` | 18 |
| USDC | `0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d` | 18 |
| U | `0xcE24439F2D9C6a2289F741120FE202248B666666` | 18 |

### Base (Chain ID: 8453)

| Token | Contract Address | Decimals |
|-------|-----------------|----------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 |
| USDT | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6 |

**Spender Address (Backend):** `0xfc625b2afee95dccc219a91d8bf391398cbeec35`
**Spender Address (Frontend Approve):** `0x7d7eECB98011AdE40bBA86598fd399F224DEd0B2`

---

## Quick Start

### Prerequisites

- Node.js ≥ 25 (uses `node:sqlite` built-in module)
- A funded EVM wallet private key (for `transferFrom` execution)

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/yyclaw.git
cd yyclaw
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=6700
ADMIN_PORT=6701
JWT_SECRET=your-secure-random-secret-here
ADMIN_KEY=your-admin-password-here
SPENDER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

### 3. Configure Upstream Models

Before the gateway can proxy requests, you need to configure upstream providers via the Admin Panel:

1. Start the server (see step 4)
2. Open `http://localhost:6701`
3. Login with your `ADMIN_KEY`
4. For each model, set:
   - `upstream_url` — the provider's base URL (e.g. `https://api.anthropic.com/v1`)
   - `upstream_key` — your API key for that provider
   - `upstream_model` — the actual model name the provider expects
   - `price_per_call` — how much to charge per call
   - `enabled` — toggle on/off

### 4. Start

```bash
# Start both gateway and admin
./start.sh

# Or manually:
node --experimental-sqlite server.js &    # Gateway on :6700
node --experimental-sqlite admin-server.js &  # Admin on :6701
```

### 5. Stop

```bash
./stop.sh
```

### 6. Verify

```bash
# List available models
curl http://localhost:6700/v1/models

# Make a test call (requires a valid API key)
curl http://localhost:6700/v1/chat/completions \
  -H "Authorization: Bearer sk-yy-YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-3-flash","messages":[{"role":"user","content":"Hello"}]}'
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `6700` | Gateway server port |
| `ADMIN_PORT` | No | `6701` | Admin panel port |
| `JWT_SECRET` | **Yes** | `yyclaw-jwt-secret-change-in-production` | Secret for signing JWT tokens (change in production!) |
| `ADMIN_KEY` | **Yes** | `yyclaw-admin-2024` | Password for admin panel API access |
| `SPENDER_PRIVATE_KEY` | **Yes** | — | Private key of the wallet that executes `transferFrom` to collect payments |

---

## API Reference

### Authentication

#### `GET /api/auth/nonce?address=0x...`

Request a login nonce for wallet signature.

**Response:**
```json
{ "nonce": "9a4dfbf4-cdae-4472-81d9-02a059d78381" }
```

#### `POST /api/auth/verify`

Verify wallet signature and get JWT + API key.

**Request:**
```json
{
  "address": "0xYourWalletAddress",
  "signature": "0xSignedMessage..."
}
```

**Signature message format:**
```
YYClaw Login
Address: 0xYourWalletAddress
Nonce: 9a4dfbf4-cdae-4472-81d9-02a059d78381
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "apiKey": "sk-yy-a1b2c3d4e5f6...",
  "balance": 0
}
```

The `token` is a JWT valid for 7 days. The `apiKey` is permanent and used for API calls.

#### `GET /api/auth/me`

Get current user info. Requires JWT in `Authorization: Bearer <token>`.

**Response:**
```json
{
  "id": 1,
  "wallet_address": "0x...",
  "balance": 0,
  "api_key": "sk-yy-...",
  "created_at": 1710000000
}
```

---

### Chat Completions (OpenAI-Compatible)

#### `POST /v1/chat/completions`

Proxies to upstream AI provider. Requires API key.

**Headers:**
```
Authorization: Bearer sk-yy-YOUR_API_KEY
Content-Type: application/json
```

**Request:**
```json
{
  "model": "gemini-3-flash",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 1024
}
```

**Response (non-streaming):**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "model": "gemini-3-flash",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "Hello! How can I help?" },
      "finish_reason": "stop"
    }
  ],
  "usage": { "prompt_tokens": 12, "completion_tokens": 8, "total_tokens": 20 }
}
```

**Response (streaming):** Server-Sent Events (SSE) — `text/event-stream`

**Flow:**
1. Validate API key → look up user
2. Resolve model (auto-append `-fixed` if needed)
3. Pre-check: verify on-chain allowance + balance across BSC/Base
4. Call upstream provider
5. On success: execute `transferFrom` to collect payment
6. On upstream failure: no charge

**Error Codes:**

| Status | Type | Description |
|--------|------|-------------|
| 400 | `invalid_request` | Missing `model` field |
| 401 | `auth_error` | Missing or invalid API key |
| 402 | `payment_error` | Insufficient allowance or balance |
| 404 | `invalid_request` | Model not found or disabled |
| 503 | `service_error` | Model upstream not configured |
| 5xx | `upstream_error` | Upstream provider error (passthrough) |

**402 Response Example:**
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

---

### Models

#### `GET /v1/models`

List all enabled models with pricing. No authentication required.

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "gemini-3-flash",
      "object": "model",
      "created": 1700000000,
      "owned_by": "yyclaw",
      "price_per_call": 0.02
    }
  ]
}
```

---

### Billing

All billing endpoints require JWT in `Authorization: Bearer <token>`.

#### `GET /api/billing/balance`

Returns total on-chain allowance across all tokens on BSC + Base.

```json
{ "balance": 150.5 }
```

#### `GET /api/billing/logs`

Returns last 50 call logs for the user.

```json
[
  {
    "model": "gemini-3-flash-fixed",
    "cost": 0.02,
    "status": "success:0xTxHash...",
    "created_at": 1710000000
  }
]
```

**Status values:**
- `success:0xTxHash` — call succeeded, payment collected
- `charge_failed_after_use` — upstream succeeded but on-chain charge failed
- `no_allowance` — pre-check failed, no sufficient allowance
- `upstream_error` — upstream provider returned an error
- `upstream_stream_error` — streaming connection broke

#### `GET /api/billing/stats`

Returns aggregated usage stats (successful calls only).

```json
{
  "total_calls": 142,
  "total_spent": 4.28
}
```

---

### Token List

#### `GET /api/tokens?chain=bsc`

Returns supported tokens for a chain (used by frontend).

```json
{
  "chain": "bsc",
  "tokens": [
    { "symbol": "USD1", "address": "0x8d0d...", "decimals": 18 },
    { "symbol": "USDT", "address": "0x55d3...", "decimals": 18 }
  ]
}
```

---

## Payment Flow

YYClaw uses an **approve-then-transferFrom** model. Users never deposit funds into the platform — tokens stay in their wallet until consumed.

### How It Works

```
User Wallet                    YYClaw Backend                 Upstream AI
     │                              │                              │
     │  1. approve(spender, $100)   │                              │
     │  (one-time on-chain tx)      │                              │
     │──────────────────────────────│                              │
     │                              │                              │
     │  2. POST /v1/chat/completions│                              │
     │  Authorization: Bearer sk-yy │                              │
     │─────────────────────────────>│                              │
     │                              │  3. Check allowance+balance  │
     │                              │  (read-only RPC call)        │
     │                              │                              │
     │                              │  4. Forward request           │
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │  5. Receive response          │
     │                              │<─────────────────────────────│
     │                              │                              │
     │                              │  6. transferFrom(user, $0.02)│
     │                              │  (on-chain tx, auto-select   │
     │                              │   best token across chains)  │
     │                              │                              │
     │  7. Return AI response       │                              │
     │<─────────────────────────────│                              │
```

### Key Properties

1. **Pre-flight check** — Before calling upstream, the gateway verifies the user has sufficient allowance AND balance. If not, returns 402 immediately (no wasted upstream calls).

2. **Charge-after-success** — The on-chain `transferFrom` only executes after the upstream provider returns a successful response. If upstream fails, the user is not charged.

3. **Auto token selection** — The gateway tries BSC first, then Base. On each chain, it iterates through all supported tokens to find one with sufficient allowance and balance.

4. **Revocable** — Users can revoke their approval at any time from the dashboard or directly on-chain. This immediately stops all future charges.

### Approve Tokens (For Users)

**Option A: Via YYClaw Dashboard**
1. Go to `https://your-domain.com/dashboard`
2. Connect wallet (MetaMask / OKX / WalletConnect)
3. Sign in with wallet signature
4. Select chain (BSC / Base) and token
5. Enter amount and click "Approve"

**Option B: Directly on-chain**
```javascript
// Using ethers.js
const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
const amount = ethers.parseUnits("100", 18); // 100 USDT
await token.approve(SPENDER_ADDRESS, amount);
```

**Option C: Via block explorer**
1. Go to BscScan / BaseScan
2. Find the token contract
3. Write Contract → `approve(spender, amount)`

---

## Frontend

The frontend is a React SPA built with Vite, using wagmi v2 for Web3 interactions.

### Tech Stack

| Library | Purpose |
|---------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| wagmi v2 | Web3 wallet connection + contract reads/writes |
| viem | Ethereum utilities |
| @tanstack/react-query | Data fetching + caching |
| react-router-dom | Client-side routing |

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Landing.jsx` | Marketing page with particle animation, features, pricing, docs |
| `/dashboard` | `Dashboard.jsx` | User dashboard with API key, stats, approve panel, logs, docs |

### Components

| Component | Description |
|-----------|-------------|
| `Navbar` | Fixed top nav with logo, links, wallet connect/disconnect |
| `Hero` | Typewriter animation hero section (used in old landing) |
| `WalletModal` | Wallet connector modal (MetaMask, WalletConnect, injected) |
| `ApprovePanel` | Chain/token selector + approve/revoke ERC20 allowance |
| `PriceTable` | Live model pricing table (fetches from `/v1/models`) |
| `CodeDocs` | Tabbed integration guide (OpenClaw Skill, Python, Node.js, cURL, ENV) |
| `CallLogs` | API call history table with status indicators |
| `AccountModal` | Legacy account management modal |

### Hooks

| Hook | Description |
|------|-------------|
| `useAuth` | Wallet signature login, JWT management, authenticated fetch |
| `useAllowance` | Read/write single token allowance + balance |
| `useAllowances` | Read all token allowances across all chains |
| `useWalletBalances` | Read all token balances across all chains |

### Build Frontend

```bash
cd frontend-react
npm install
npm run build
# Output goes to ../frontend-dist/ (served by gateway)
```

### Build Admin Frontend

```bash
cd admin-react
npm install
npm run build
# Output goes to ../admin-dist/ (served by gateway at /admin)
```

---

## Admin Panel

Access at `http://localhost:6701` (standalone) or `http://localhost:6700/admin` (served by gateway).

All admin API endpoints require the `X-Admin-Key` header matching `ADMIN_KEY` from `.env`.

### Admin API Reference

#### Models

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/api/models` | List all models |
| `POST` | `/admin/api/models` | Create a new model |
| `PUT` | `/admin/api/models/:id` | Update model config |
| `DELETE` | `/admin/api/models/:id` | Delete a model |

**Create/Update Model Body:**
```json
{
  "name": "gpt-4o-fixed",
  "upstream_url": "https://api.openai.com/v1",
  "upstream_key": "sk-xxx",
  "upstream_model": "gpt-4o",
  "price_per_call": 0.05,
  "enabled": true
}
```

#### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/api/users` | List all users |
| `POST` | `/admin/api/users/:id/topup` | Add balance to user |

**Top-up Body:**
```json
{ "amount": 10.0 }
```

#### Stats & Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/api/stats` | Global stats (total calls, revenue, users) |
| `GET` | `/admin/api/logs` | Last 100 call logs with user info |

**Stats Response:**
```json
{
  "total_calls": 1542,
  "total_revenue": 48.26,
  "today_calls": 87,
  "today_revenue": 2.14,
  "total_users": 23
}
```

### Admin Frontend Pages

| Page | Description |
|------|-------------|
| Login | Admin key authentication |
| Dashboard | Revenue charts, call volume, user count |
| Models | CRUD table for model configuration |
| Users | User list with wallet addresses, balances, API keys |
| Logs | Real-time call log viewer |

---

## OpenClaw Skill Integration

YYClaw ships with an OpenClaw Skill that lets any OpenClaw agent use YYClaw as its AI provider with zero per-app configuration.

### Install the Skill

```bash
clawhub install yyclaw
```

Or manually copy the `skill/` directory to `~/.openclaw/workspace/skills/yyclaw/`.

### Skill Configuration

Set environment variables or add to `~/.openclaw/config.yaml`:

**Option A: Environment Variables**
```bash
export YYCLAW_API_KEY="sk-yy-YOUR_KEY"
export YYCLAW_BASE_URL="https://crypto.yyclaw.cc/v1"
```

**Option B: OpenClaw config.yaml**
```yaml
# ~/.openclaw/config.yaml
providers:
  yyclaw:
    url: https://crypto.yyclaw.cc/v1
    key: sk-yy-YOUR_KEY
    models:
      - gemini-3-flash
      - claude-sonnet-4-6
      - claude-opus-4.6
      - gemini-3-pro-preview

default_model: yyclaw/gemini-3-flash
```

### What Gets Routed

Once configured, all of these automatically use YYClaw:

| Application | How |
|-------------|-----|
| OpenClaw agents | Main + sub-agents inherit provider config |
| Codex CLI | Via `OPENAI_BASE_URL` |
| Claude Code | Via provider config |
| Cursor / Continue | Custom API endpoint setting |
| Python scripts | OpenAI SDK `base_url` parameter |
| Any OpenAI client | Drop-in compatible |

### Skill Commands

The skill responds to natural language:

- **"check my yyclaw balance"** → `GET /api/billing/balance`
- **"list yyclaw models"** → `GET /v1/models`
- **"use yyclaw to call gemini-3-flash with: ..."** → `POST /v1/chat/completions`
- **"show my yyclaw usage"** → `GET /api/billing/logs`

### Skill File Structure

```
skill/
└── SKILL.md          # Skill definition (triggers, config, usage instructions)
```

### Publishing to ClawHub

```bash
cd skill
clawhub publish
```

---

## SDK Integration

YYClaw is 100% OpenAI-compatible. Any SDK or tool that supports custom `base_url` works out of the box.

### Python

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-yy-YOUR_KEY",
    base_url="https://crypto.yyclaw.cc/v1"
)

# Non-streaming
response = client.chat.completions.create(
    model="gemini-3-flash",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    temperature=0.7,
    max_tokens=1024
)
print(response.choices[0].message.content)

# Streaming
stream = client.chat.completions.create(
    model="claude-sonnet-4-6",
    messages=[{"role": "user", "content": "Write a haiku"}],
    stream=True
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### Node.js / TypeScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-yy-YOUR_KEY',
  baseURL: 'https://crypto.yyclaw.cc/v1'
});

// Non-streaming
const response = await client.chat.completions.create({
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user', content: 'Hello!' }]
});
console.log(response.choices[0].message.content);

// Streaming
const stream = await client.chat.completions.create({
  model: 'gemini-3-flash',
  messages: [{ role: 'user', content: 'Tell me a joke' }],
  stream: true
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### cURL

```bash
# Non-streaming
curl https://crypto.yyclaw.cc/v1/chat/completions \
  -H "Authorization: Bearer sk-yy-YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-3-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# Streaming
curl https://crypto.yyclaw.cc/v1/chat/completions \
  -H "Authorization: Bearer sk-yy-YOUR_KEY" \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "model": "gemini-3-flash",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'

# List models
curl https://crypto.yyclaw.cc/v1/models
```

### Global Environment Override

Set these and every OpenAI-compatible tool on your system uses YYClaw:

```bash
# Add to ~/.bashrc or ~/.zshrc
export OPENAI_API_KEY="sk-yy-YOUR_KEY"
export OPENAI_BASE_URL="https://crypto.yyclaw.cc/v1"
```

This works with: `openai` CLI, `codex`, `aider`, `continue`, `cursor`, `llm`, and any tool reading `OPENAI_API_KEY` + `OPENAI_BASE_URL`.

### LangChain

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gemini-3-flash",
    api_key="sk-yy-YOUR_KEY",
    base_url="https://crypto.yyclaw.cc/v1"
)
response = llm.invoke("What is the meaning of life?")
```

### LlamaIndex

```python
from llama_index.llms.openai import OpenAI

llm = OpenAI(
    model="claude-sonnet-4-6",
    api_key="sk-yy-YOUR_KEY",
    api_base="https://crypto.yyclaw.cc/v1"
)
```

---

## Deployment

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change `ADMIN_KEY` to a strong password
- [ ] Set `SPENDER_PRIVATE_KEY` to a dedicated hot wallet (not your main wallet)
- [ ] Fund the spender wallet with gas (BNB on BSC, ETH on Base) for `transferFrom` transactions
- [ ] Set up HTTPS via reverse proxy (nginx / Caddy)
- [ ] Configure upstream models in admin panel
- [ ] Build frontend: `cd frontend-react && npm run build`
- [ ] Build admin frontend: `cd admin-react && npm run build`

### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name crypto.yyclaw.cc;

    ssl_certificate     /etc/letsencrypt/live/crypto.yyclaw.cc/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crypto.yyclaw.cc/privkey.pem;

    # Gateway
    location / {
        proxy_pass http://127.0.0.1:6700;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
        proxy_buffering off;  # Required for SSE streaming
    }
}
```

### systemd Service

```ini
# /etc/systemd/system/yyclaw.service
[Unit]
Description=YYClaw AI Gateway
After=network.target

[Service]
Type=simple
User=yyclaw
WorkingDirectory=/opt/yyclaw
ExecStart=/usr/bin/node --experimental-sqlite server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable yyclaw
sudo systemctl start yyclaw
```

### Docker (Optional)

```dockerfile
FROM node:25-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN cd frontend-react && npm ci && npm run build && cd ..
RUN cd admin-react && npm ci && npm run build && cd ..
EXPOSE 6700
CMD ["node", "--experimental-sqlite", "server.js"]
```

```bash
docker build -t yyclaw .
docker run -d --name yyclaw \
  -p 6700:6700 \
  --env-file .env \
  -v ./yyclaw.db:/app/yyclaw.db \
  yyclaw
```

---

## Security

### Wallet Authentication

- Uses EIP-191 personal message signing — no private keys ever touch the server
- Nonces are single-use and deleted after verification
- JWTs expire after 7 days

### API Key Security

- API keys are generated server-side (`sk-yy-` prefix + UUID)
- Keys are stored in SQLite, one per wallet address
- Keys are permanent — revocation requires admin intervention or wallet disconnect

### On-Chain Security

- The spender wallet only has `transferFrom` capability — it can only move tokens the user has explicitly approved
- Users can revoke approval at any time (from dashboard or directly on-chain)
- Pre-flight balance checks prevent failed transactions
- All charge transactions are logged with tx hashes

### Admin Panel

- Protected by `X-Admin-Key` header
- Should be restricted to internal network or VPN in production
- Consider adding IP allowlist in nginx

### Recommendations

- Use a dedicated hot wallet for `SPENDER_PRIVATE_KEY` with minimal gas balance
- Monitor the spender wallet for unusual activity
- Rotate `JWT_SECRET` periodically
- Keep `ADMIN_KEY` out of version control
- Enable HTTPS in production

---

## Troubleshooting

### Common Issues

**402 Payment Required**
- User hasn't approved tokens, or allowance is depleted
- Check: user needs to approve tokens on the dashboard or directly on-chain
- Verify the spender address matches what the user approved

**503 Model Not Configured**
- The model exists in DB but `upstream_url` or `upstream_key` is empty
- Fix: configure the model in admin panel

**401 Invalid API Key**
- The `sk-yy-` key doesn't exist in the database
- User needs to connect wallet and sign in to get a key

**Upstream Timeout**
- Default timeout: 60s (non-streaming), 30s (streaming first byte)
- Some models (opus, thinking) may need longer — adjust in `routes/api.js`

**transferFrom Failed**
- Spender wallet may be out of gas (BNB/ETH)
- Token contract may have transfer restrictions
- Check: `status` field in call_logs for `charge_failed_after_use`

**Node.js Version Error**
- YYClaw requires Node.js ≥ 25 for built-in `node:sqlite`
- If using older Node.js, add `better-sqlite3` as a dependency and update `db.js`

### Logs

Call logs are stored in `call_logs` table. Query directly:

```bash
# Using sqlite3 CLI
sqlite3 yyclaw.db "SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 20;"

# Check failed charges
sqlite3 yyclaw.db "SELECT * FROM call_logs WHERE status LIKE 'charge_failed%';"

# Revenue summary
sqlite3 yyclaw.db "SELECT model, COUNT(*) as calls, SUM(cost) as revenue FROM call_logs WHERE status LIKE 'success%' GROUP BY model;"
```

---

## Project Structure

```
YYClaw/
├── server.js              # Main gateway server (Express)
├── admin-server.js        # Admin panel server (Express)
├── db.js                  # SQLite database init + model seeding
├── package.json           # Dependencies
├── .env                   # Environment config (not committed)
├── start.sh               # Start both servers
├── stop.sh                # Stop both servers
├── yyclaw.db              # SQLite database (auto-created)
│
├── routes/
│   ├── api.js             # /v1/chat/completions + /v1/models
│   ├── auth.js            # /api/auth/nonce + /api/auth/verify + /api/auth/me
│   ├── billing.js         # /api/billing/balance + /logs + /stats
│   ├── admin.js           # /admin/api/* (models, users, stats, logs)
│   └── x402.js            # x402 payment middleware + token registry
│
├── lib/
│   └── onchain.js         # ERC20 transferFrom, allowance checks, auto-charge
│
├── skill/
│   └── SKILL.md           # OpenClaw Skill definition
│
├── frontend-react/        # User-facing React SPA (source)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── config.js      # Chains, tokens, models, ABI
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── WalletModal.jsx
│   │   │   ├── ApprovePanel.jsx
│   │   │   ├── PriceTable.jsx
│   │   │   ├── CodeDocs.jsx
│   │   │   ├── CallLogs.jsx
│   │   │   └── AccountModal.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useAllowance.js
│   │   │   ├── useAllowances.js
│   │   │   └── useWalletBalances.js
│   │   └── lib/
│   │       ├── wagmiConfig.js
│   │       └── contracts.js
│   └── public/
│       └── icons/         # Token/chain/wallet icons
│
├── frontend-dist/         # Built frontend (served by gateway)
├── admin-react/           # Admin React SPA (source)
└── admin-dist/            # Built admin frontend (served by gateway at /admin)
```

---

## Database Schema

```sql
-- Users (one per wallet address)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT UNIQUE NOT NULL,
  balance REAL DEFAULT 0,
  api_key TEXT UNIQUE,
  created_at INTEGER DEFAULT (unixepoch())
);

-- AI Models (configurable via admin)
CREATE TABLE models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,        -- e.g. "gemini-3-flash-fixed"
  upstream_url TEXT DEFAULT '',      -- e.g. "https://api.provider.com/v1"
  upstream_key TEXT DEFAULT '',      -- provider API key
  upstream_model TEXT DEFAULT '',    -- actual model name for provider
  price_per_call REAL NOT NULL,     -- USD per call
  enabled INTEGER DEFAULT 1
);

-- API Call Logs
CREATE TABLE call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  model TEXT,
  cost REAL,
  status TEXT,                      -- "success:0xHash", "upstream_error", etc.
  created_at INTEGER DEFAULT (unixepoch())
);

-- Prevent double-spend of tx hashes
CREATE TABLE used_tx_hashes (
  hash TEXT PRIMARY KEY,
  chain TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Single-use login nonces
CREATE TABLE nonces (
  address TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
```

---

## License

MIT

---

<div align="center">
  <p><strong>YYClaw</strong> — The fastest way to access AI models with crypto.</p>
  <p>Built with ❤️ and stablecoins.</p>
</div>
]]>