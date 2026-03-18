# Frontend Guide

YYClaw's user-facing frontend is a React SPA built with Vite, using wagmi v2 for Web3 wallet interactions.

---

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| Vite | 5+ | Build tool + dev server |
| wagmi | 2.x | Web3 wallet connection, contract reads/writes |
| viem | 2.x | Ethereum utilities (ABI encoding, formatting) |
| @tanstack/react-query | 5.x | Async state management + caching |
| react-router-dom | 6.x | Client-side routing |

---

## Project Structure

```
frontend-react/
├── index.html                 # Entry HTML
├── vite.config.js             # Vite configuration
├── package.json
├── public/
│   ├── favicon.png
│   └── icons/                 # Token, chain, wallet icons
│       ├── yyclaw-logo.png
│       ├── yyclaw-192.png
│       ├── bnb.png
│       ├── base.jpg
│       ├── usdc.png
│       ├── usdt.png
│       ├── usd1.png
│       ├── u.png
│       ├── metamask.svg
│       └── okx.jpg
└── src/
    ├── main.jsx               # App entry point (wagmi + react-query providers)
    ├── App.jsx                # Router setup
    ├── index.css              # Global styles
    ├── config.js              # Chains, tokens, models, ABI definitions
    ├── pages/
    │   ├── Landing.jsx        # Marketing landing page
    │   └── Dashboard.jsx      # User dashboard
    ├── components/
    │   ├── Navbar.jsx         # Top navigation bar
    │   ├── Hero.jsx           # Typewriter hero section
    │   ├── WalletModal.jsx    # Wallet connector modal
    │   ├── ApprovePanel.jsx   # Token authorization panel
    │   ├── PriceTable.jsx     # Live model pricing table
    │   ├── CodeDocs.jsx       # Integration guide (tabbed)
    │   ├── CallLogs.jsx       # API call history
    │   └── AccountModal.jsx   # Legacy account modal
    ├── hooks/
    │   ├── useAuth.js         # Wallet signature login + JWT
    │   ├── useAllowance.js    # Single token allowance read/write
    │   ├── useAllowances.js   # All token allowances (multi-chain)
    │   └── useWalletBalances.js # All token balances (multi-chain)
    └── lib/
        ├── wagmiConfig.js     # Wagmi chain + connector config
        └── contracts.js       # Token addresses, ABI, spender address
```

---

## Pages

### Landing Page (`/`)

The marketing page with:

- **Particle canvas** — animated background with connected dots (Binance gold theme)
- **Hero section** — gradient title, stats counters (50+ models, 99.9% uptime, <100ms latency)
- **Features grid** — 6 feature cards with scroll-reveal animation
- **Pricing section** — live model pricing table (fetches from `/v1/models`)
- **Docs section** — tabbed integration guide (OpenClaw Skill, Python, Node.js, cURL, ENV)
- **CTA section** — "Ready to Build?" call-to-action
- **Footer** — copyright

### Dashboard (`/dashboard`)

The user control panel with:

- **API Key display** — copy button + Quick Start link
- **Stats cards** — Authorized (allowance), Spent, Remaining, Wallet Balance
- **Tabs:**
  - **Overview** — Token authorization panel + model pricing
  - **Logs** — API call history with status indicators
  - **Docs** — Integration guide with user's actual API key pre-filled

**States:**
1. Not connected → "Connect Wallet" prompt
2. Connected but not signed in → "Sign In with Wallet" prompt
3. Signed in → Full dashboard

---

## Components

### Navbar

Fixed top navigation with:
- Logo (YYClaw with gradient text)
- Navigation links (Home, Dashboard, Docs, Pricing)
- Wallet button (Connect / address dropdown with Disconnect)

### WalletModal

Modal for connecting wallets. Supports:
- MetaMask (with icon)
- OKX Wallet (with icon)
- WalletConnect
- Any injected wallet

Uses wagmi's `useConnect` hook.

### ApprovePanel

Token authorization interface:
1. **Chain selector** — BSC / Base (switches wallet network via `useSwitchChain`)
2. **Token selector** — shows all tokens for selected chain with icons
3. **Balance display** — current allowance + wallet balance
4. **Amount input** — with $10 / $50 / $100 quick buttons
5. **Approve button** — calls ERC20 `approve(spender, amount)`
6. **Revoke button** — calls `approve(spender, 0)`
7. **Transaction confirmation** — shows success message

Persists chain/token selection to `localStorage`.

### PriceTable

Fetches models from `/v1/models` and displays a sorted pricing table. Strips `-fixed` suffix from model names.

### CodeDocs

Tabbed integration guide with 5 tabs:
- **OpenClaw Skill** — `clawhub install yyclaw` + config
- **Python** — OpenAI SDK example
- **Node.js** — OpenAI SDK example
- **cURL** — command-line example
- **ENV Override** — global environment variable setup + OpenClaw config.yaml

When rendered on the dashboard, the user's actual API key is pre-filled in code examples.

### CallLogs

API call history table showing:
- Model name (without `-fixed` suffix)
- Cost
- Status (color-coded: green=success, red=error, yellow=pending)
- Timestamp

Also shows aggregate stats (total calls, total spent).

---

## Hooks

### useAuth

Handles the wallet signature login flow:

```
1. GET /api/auth/nonce?address=0x...     → receive nonce
2. Sign message: "YYClaw Login\nAddress: ...\nNonce: ..."
3. POST /api/auth/verify { address, signature }  → receive JWT + API key
4. Store JWT in localStorage
```

Returns: `{ token, login, logout, loading, error, authFetch, isLoggedIn }`

`authFetch` is a wrapper around `fetch` that auto-injects the JWT and handles 401 (auto-logout).

### useAllowance

Reads and writes a single token's allowance:
- Reads `allowance(owner, spender)` and `balanceOf(owner)` via `useReadContract`
- Writes `approve(spender, amount)` via `useWriteContract`
- Auto-refetches every 10 seconds
- Tracks transaction confirmation via `useWaitForTransactionReceipt`

### useAllowances

Reads all token allowances across all chains in a single multicall:
- Builds an array of `allowance(owner, spender)` calls for every token on every chain
- Uses `useReadContracts` for batched reads
- Returns `{ allowances: [...], totalAllowance }`

### useWalletBalances

Same pattern as `useAllowances` but reads `balanceOf(owner)` for all tokens:
- Returns `{ balances: [...], totalUsd }`
- Since all tokens are stablecoins, `totalUsd = sum of all balances`

---

## Configuration Files

### wagmiConfig.js

Configures wagmi with:
- **Chains:** BSC (56), Base (8453), Ethereum Mainnet (1)
- **Connectors:** MetaMask, WalletConnect
- **Transports:** HTTP RPC for each chain

> To use WalletConnect, replace `YOUR_WC_PROJECT_ID` with a real project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).

### contracts.js

Defines:
- `SPENDER_ADDRESS` — the address users approve tokens to
- `CHAINS` — chain metadata (id, name, symbol, rpc, icon)
- `TOKENS` — per-chain token list (symbol, address, decimals, icon)
- `ERC20_ABI` — minimal ABI for approve, allowance, balanceOf, decimals

### config.js

Frontend-only configuration:
- Chain definitions (id, hex, name, rpc, symbol)
- Token definitions with icons
- Payment address
- Model list with provider and pricing
- ERC20 ABI (human-readable format)

---

## Building

### Development

```bash
cd frontend-react
npm install
npm run dev    # Starts Vite dev server with HMR
```

> The dev server proxies API requests to `http://localhost:6700`. Configure in `vite.config.js`.

### Production Build

```bash
cd frontend-react
npm ci
npm run build
```

Output goes to `../frontend-dist/` which is served by the gateway's Express static middleware.

### Customization

**Theme colors** (Binance-inspired):
- Background: `#0B0E11` (darkest), `#181A20` (cards)
- Accent: `#F0B90B` (Binance gold)
- Green: `#0ECB81` (success)
- Red: `#F6465D` (error)
- Text: `#EAECEF` (primary), `#848E9C` (secondary), `#5E6673` (muted)
- Border: `#2B3139`

**Adding a new token:**
1. Add to `src/lib/contracts.js` → `TOKENS`
2. Add to `src/config.js` → `TOKENS`
3. Add icon to `public/icons/`
4. Backend: add to `lib/onchain.js` → `CHAINS`
5. Backend: add to `routes/x402.js` → `TOKENS`

**Adding a new chain:**
1. Add chain definition to `src/lib/wagmiConfig.js`
2. Add to `src/lib/contracts.js` → `CHAINS` and `TOKENS`
3. Add to `src/config.js`
4. Backend: add to `lib/onchain.js` → `CHAINS`
5. Backend: add to `routes/x402.js` → `TOKENS` and `NETWORK_IDS`

---

## Admin Frontend

The admin panel is a separate React SPA in `admin-react/`.

### Pages

| Page | Description |
|------|-------------|
| Login | Admin key input |
| Dashboard | Revenue, call volume, user count |
| Models | CRUD table — configure upstream URL, key, model, price, enabled |
| Users | User list with wallet addresses, balances, API keys |
| Logs | Call log viewer with status, cost, timestamps |

### Building

```bash
cd admin-react
npm ci
npm run build    # Output → ../admin-dist/
```

Served by the gateway at `/admin/*`.
