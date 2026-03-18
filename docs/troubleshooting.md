# Troubleshooting

Common issues and solutions for YYClaw.

---

## API Errors

### 401 — Invalid API Key

**Symptom:** `{"error":{"message":"Invalid API key","type":"auth_error"}}`

**Causes:**
- API key doesn't exist in the database
- Typo in the `sk-yy-...` key
- Using a JWT token instead of an API key (or vice versa)

**Fix:**
1. Verify the key exists: `sqlite3 yyclaw.db "SELECT api_key FROM users WHERE api_key = 'sk-yy-YOUR_KEY';"`
2. Get a new key by connecting wallet at the dashboard and signing in
3. Make sure you're using `Authorization: Bearer sk-yy-...` (not a JWT)

---

### 402 — Insufficient Allowance

**Symptom:** `{"error":{"message":"Insufficient allowance or balance...","type":"payment_error"}}`

**Causes:**
- User hasn't approved any tokens
- Allowance has been fully consumed
- User has allowance but insufficient token balance
- Approved on wrong chain (e.g. approved on BSC but balance is on Base)

**Fix:**
1. Check allowance on-chain:
```bash
# Check USDT allowance on BSC
curl -s -X POST https://bsc-dataseed.binance.org/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x55d398326f99059ff775485246999027b3197955","data":"0xdd62ed3e000000000000000000000000USER_ADDRESS000000000000000000000000SPENDER_ADDRESS"},"latest"],"id":1}'
```
2. Approve more tokens via the dashboard
3. Ensure the user has actual token balance (not just allowance)

---

### 404 — Model Not Found

**Symptom:** `{"error":{"message":"Model xxx not found","type":"invalid_request"}}`

**Causes:**
- Model name doesn't exist in the database
- Model exists but is disabled (`enabled = 0`)
- Typo in model name

**Fix:**
1. List available models: `curl http://localhost:6700/v1/models`
2. Check DB: `sqlite3 yyclaw.db "SELECT name, enabled FROM models;"`
3. Enable the model in admin panel if disabled
4. Remember: send `gemini-3-flash` (without `-fixed`), the gateway appends it

---

### 503 — Model Not Configured

**Symptom:** `{"error":{"message":"Model not configured","type":"service_error"}}`

**Causes:**
- Model exists in DB but `upstream_url` or `upstream_key` is empty

**Fix:**
1. Open admin panel → Models
2. Configure `upstream_url`, `upstream_key`, and `upstream_model` for the model
3. Test the upstream directly:
```bash
curl https://UPSTREAM_URL/chat/completions \
  -H "Authorization: Bearer UPSTREAM_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"UPSTREAM_MODEL","messages":[{"role":"user","content":"test"}]}'
```

---

### 5xx — Upstream Error

**Symptom:** Error from the upstream AI provider (passed through)

**Causes:**
- Upstream provider is down
- Upstream API key is invalid or expired
- Upstream rate limit exceeded
- Request format not supported by upstream

**Fix:**
1. Check the upstream provider's status page
2. Verify the upstream API key is valid
3. Test the upstream directly (see 503 fix above)
4. Check call_logs for the error: `sqlite3 yyclaw.db "SELECT * FROM call_logs WHERE status = 'upstream_error' ORDER BY created_at DESC LIMIT 5;"`

---

## On-Chain Issues

### transferFrom Failed (charge_failed_after_use)

**Symptom:** API call succeeds but payment collection fails. Logged as `charge_failed_after_use`.

**Causes:**
- Spender wallet out of gas (BNB on BSC, ETH on Base)
- Token contract has transfer restrictions
- Allowance was revoked between pre-check and charge
- RPC node timeout

**Fix:**
1. Check spender wallet gas balance
2. Fund the spender wallet with gas tokens
3. Check failed charges:
```bash
sqlite3 yyclaw.db "SELECT * FROM call_logs WHERE status LIKE 'charge_failed%' ORDER BY created_at DESC LIMIT 10;"
```
4. Consider the debt — the user got the AI response but wasn't charged

### Gas Estimation

Each `transferFrom` costs approximately:
- BSC: ~50,000 gas × ~3 gwei = ~0.00015 BNB
- Base: ~50,000 gas × ~0.01 gwei = ~0.0000005 ETH

Keep at least 0.1 BNB and 0.01 ETH in the spender wallet.

---

## Server Issues

### Node.js Version Error

**Symptom:** `Error: Cannot find module 'node:sqlite'`

**Cause:** Node.js version < 25. YYClaw uses the built-in `node:sqlite` module.

**Fix:**
```bash
node --version  # Must be ≥ 25

# Install Node.js 25
nvm install 25
nvm use 25

# Or use the --experimental-sqlite flag
node --experimental-sqlite server.js
```

### Port Already in Use

**Symptom:** `Error: listen EADDRINUSE :::6700`

**Fix:**
```bash
# Find what's using the port
lsof -i :6700

# Kill it
kill -9 <PID>

# Or use stop.sh
./stop.sh
```

### SQLite Lock Error

**Symptom:** `SQLITE_BUSY: database is locked`

**Cause:** Multiple processes writing to the same SQLite file simultaneously.

**Fix:**
1. Ensure only one gateway process is running
2. Stop any direct SQLite CLI sessions
3. If using PM2 cluster mode, migrate to PostgreSQL

### Frontend Not Loading

**Symptom:** Blank page or 404 on `/`

**Causes:**
- Frontend not built (`frontend-dist/` is empty)
- Wrong working directory

**Fix:**
```bash
# Build frontend
cd frontend-react && npm ci && npm run build && cd ..

# Verify
ls frontend-dist/index.html
```

---

## Wallet / Frontend Issues

### Wallet Won't Connect

**Causes:**
- MetaMask not installed
- Wrong network selected
- Browser blocking popups

**Fix:**
1. Install MetaMask or OKX Wallet
2. The app will prompt to switch networks automatically
3. Allow popups from the site

### Sign-In Fails

**Symptom:** "Verify failed" or signature error

**Causes:**
- Nonce expired (requested too long ago)
- User rejected the signature in wallet
- Address mismatch

**Fix:**
1. Refresh the page and try again (gets a fresh nonce)
2. Make sure you're signing with the same address shown in the wallet

### Allowance Shows 0 After Approving

**Causes:**
- Transaction still pending
- Approved on wrong chain
- RPC node lag

**Fix:**
1. Wait for transaction confirmation (check on BscScan/BaseScan)
2. Verify you approved on the correct chain
3. The dashboard auto-refreshes every 10 seconds — wait a moment

---

## Debugging

### Enable Verbose Logging

Add to your start command:

```bash
DEBUG=* node --experimental-sqlite server.js
```

### Query the Database

```bash
# All users
sqlite3 yyclaw.db "SELECT * FROM users;"

# All models with config
sqlite3 yyclaw.db "SELECT id, name, upstream_url, price_per_call, enabled FROM models;"

# Recent calls
sqlite3 yyclaw.db "SELECT cl.id, u.wallet_address, cl.model, cl.cost, cl.status, datetime(cl.created_at, 'unixepoch') FROM call_logs cl LEFT JOIN users u ON cl.user_id = u.id ORDER BY cl.created_at DESC LIMIT 20;"

# Revenue by model
sqlite3 yyclaw.db "SELECT model, COUNT(*) as calls, SUM(cost) as revenue FROM call_logs WHERE status LIKE 'success%' GROUP BY model ORDER BY revenue DESC;"

# Failed charges (debt)
sqlite3 yyclaw.db "SELECT u.wallet_address, cl.model, cl.cost, datetime(cl.created_at, 'unixepoch') FROM call_logs cl JOIN users u ON cl.user_id = u.id WHERE cl.status LIKE 'charge_failed%';"
```

### Test Upstream Directly

Bypass YYClaw and test the upstream provider:

```bash
curl https://UPSTREAM_URL/chat/completions \
  -H "Authorization: Bearer UPSTREAM_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"UPSTREAM_MODEL","messages":[{"role":"user","content":"ping"}]}'
```

### Check RPC Connectivity

```bash
# BSC
curl -s -X POST https://bsc-dataseed.binance.org/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Base
curl -s -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```
