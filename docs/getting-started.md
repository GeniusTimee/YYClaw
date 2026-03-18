# Getting Started

This guide walks you through setting up YYClaw from scratch — from installation to your first API call.

## Prerequisites

- **Node.js ≥ 25** (uses built-in `node:sqlite` module)
- **npm** (comes with Node.js)
- **An EVM wallet** with a private key (for collecting payments via `transferFrom`)
- **Gas funds** on BSC (BNB) and/or Base (ETH) for the spender wallet

## Installation

```bash
git clone https://github.com/yourorg/yyclaw.git
cd yyclaw
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
PORT=6700
ADMIN_PORT=6701
JWT_SECRET=change-this-to-a-random-64-char-string
ADMIN_KEY=your-secure-admin-password
SPENDER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

### Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `6700` | Gateway server port |
| `ADMIN_PORT` | No | `6701` | Admin panel port |
| `JWT_SECRET` | **Yes** | — | Secret for JWT token signing. Must be changed in production. |
| `ADMIN_KEY` | **Yes** | — | Password for admin panel access |
| `SPENDER_PRIVATE_KEY` | **Yes** | — | Private key of the wallet that executes `transferFrom` to collect payments |

> ⚠️ Never commit `.env` to version control. The `.gitignore` already excludes it.

## Starting the Server

```bash
# Start both gateway (:6700) and admin (:6701)
./start.sh
```

Or manually:

```bash
node --experimental-sqlite server.js &       # Gateway
node --experimental-sqlite admin-server.js & # Admin
```

Verify it's running:

```bash
curl http://localhost:6700/v1/models
```

You should see a JSON response with `"object": "list"`.

## Configure Upstream Models

Before the gateway can proxy AI requests, you need to configure at least one upstream provider.

1. Open the admin panel: `http://localhost:6701`
2. Enter your `ADMIN_KEY`
3. Go to **Models**
4. Click on a model (e.g. `gemini-3-flash-fixed`)
5. Fill in:
   - **upstream_url**: `https://generativelanguage.googleapis.com/v1beta` (example for Gemini)
   - **upstream_key**: your provider API key
   - **upstream_model**: the model name the provider expects (e.g. `gemini-2.0-flash`)
   - **price_per_call**: price in USD (e.g. `0.02`)
   - **enabled**: ✅
6. Save

Repeat for each model you want to offer.

## Your First API Call

### Step 1: Get an API Key

Connect a wallet to the frontend at `http://localhost:6700`:

1. Click **Connect Wallet** (MetaMask, OKX, or WalletConnect)
2. Sign the login message
3. Your API key (`sk-yy-...`) appears on the dashboard

### Step 2: Approve Tokens

On the dashboard, go to **Token Authorization**:

1. Select chain (BSC or Base)
2. Select token (USD1, USDT, USDC, etc.)
3. Enter amount (e.g. `50`)
4. Click **Approve** and confirm the transaction in your wallet

This authorizes YYClaw to deduct up to that amount from your wallet per API call.

### Step 3: Make a Call

```bash
curl http://localhost:6700/v1/chat/completions \
  -H "Authorization: Bearer sk-yy-YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-3-flash",
    "messages": [{"role": "user", "content": "Hello, world!"}]
  }'
```

If everything is configured correctly, you'll get an AI response and the call cost will be deducted from your approved allowance.

## Stopping the Server

```bash
./stop.sh
```

## Next Steps

- [API Reference](./api-reference.md) — full endpoint documentation
- [Payment System](./payment-system.md) — how on-chain billing works
- [Admin Guide](./admin-guide.md) — managing models, users, and analytics
- [SDK Integration](./sdk-integration.md) — Python, Node.js, cURL, LangChain, etc.
- [OpenClaw Skill](./openclaw-skill.md) — one-click integration for OpenClaw agents
- [Deployment](./deployment.md) — production setup with nginx, systemd, Docker
