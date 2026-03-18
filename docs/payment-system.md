# Payment System

YYClaw uses an on-chain **approve-then-transferFrom** model. Users never deposit funds into the platform — tokens stay in their own wallet until consumed by an API call.

---

## How It Works

### Overview

```
┌──────────────┐                    ┌──────────────┐                ┌──────────────┐
│  User Wallet │                    │   YYClaw     │                │  Upstream AI │
│  (MetaMask)  │                    │   Gateway    │                │  Provider    │
└──────┬───────┘                    └──────┬───────┘                └──────┬───────┘
       │                                   │                               │
       │  1. approve(spender, $100)        │                               │
       │   (one-time on-chain tx)          │                               │
       │──────────────────────────────────>│                               │
       │                                   │                               │
       │  2. POST /v1/chat/completions     │                               │
       │   Authorization: Bearer sk-yy-... │                               │
       │──────────────────────────────────>│                               │
       │                                   │                               │
       │                                   │  3. Check allowance + balance │
       │                                   │     (read-only RPC call)      │
       │                                   │                               │
       │                                   │  4. Forward request           │
       │                                   │──────────────────────────────>│
       │                                   │                               │
       │                                   │  5. Receive AI response       │
       │                                   │<──────────────────────────────│
       │                                   │                               │
       │                                   │  6. transferFrom(user, $0.02) │
       │                                   │     (on-chain tx)             │
       │                                   │                               │
       │  7. Return AI response            │                               │
       │<──────────────────────────────────│                               │
```

### Step-by-Step

1. **User approves tokens** — The user calls `approve(spenderAddress, amount)` on an ERC20 token contract. This grants YYClaw permission to move up to `amount` tokens from the user's wallet. This is a standard ERC20 operation done once (or whenever the user wants to add more allowance).

2. **User makes an API call** — Standard OpenAI-compatible request with `Authorization: Bearer sk-yy-...`.

3. **Pre-flight check** — Before touching the upstream provider, YYClaw reads the user's on-chain allowance and balance across all supported tokens on BSC and Base. If no token has sufficient allowance AND balance, the request is rejected with HTTP 402 immediately.

4. **Upstream call** — The request is forwarded to the configured upstream AI provider.

5. **Charge on success** — Only after the upstream returns a successful response, YYClaw executes `transferFrom(userAddress, spenderAddress, cost)` to collect the per-call fee.

6. **Charge on failure** — If the upstream fails, the user is NOT charged. If the upstream succeeds but the on-chain charge fails, the call is logged as `charge_failed_after_use` (the user still gets the AI response).

---

## Token Selection Algorithm

When charging a user, YYClaw uses the `autoCharge` function:

```
For each chain in [BSC, Base]:
  For each token in chain's token list:
    1. Read allowance(user, spender)
    2. If allowance >= cost:
       a. Read balanceOf(user)
       b. If balance >= cost:
          → Execute transferFrom(user, spender, cost)
          → Return success
    3. Continue to next token
Return: no suitable token found (402)
```

**Priority order:**
- BSC is checked before Base
- Within each chain, tokens are checked in registry order:
  - BSC: USD1 → USDT → USDC → U
  - Base: USDC → USDT

The first token with sufficient allowance AND balance wins.

---

## Supported Tokens

### BSC (BNB Smart Chain — Chain ID: 56)

| Token | Contract | Decimals | Notes |
|-------|----------|----------|-------|
| USD1 | `0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d` | 18 | Default on BSC |
| USDT | `0x55d398326f99059ff775485246999027b3197955` | 18 | Binance-Peg USDT |
| USDC | `0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d` | 18 | Binance-Peg USDC |
| U | `0xcE24439F2D9C6a2289F741120FE202248B666666` | 18 | — |

### Base (Chain ID: 8453)

| Token | Contract | Decimals | Notes |
|-------|----------|----------|-------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 | Native USDC on Base |
| USDT | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6 | — |

> All tokens are stablecoins pegged to $1 USD. The gateway treats 1 token = $1.

---

## Spender Addresses

| Context | Address | Purpose |
|---------|---------|---------|
| Backend (`transferFrom`) | `0xfc625b2afee95dccc219a91d8bf391398cbeec35` | Wallet that executes `transferFrom` to collect payments |
| Frontend (Approve target) | `0x7d7eECB98011AdE40bBA86598fd399F224DEd0B2` | Address users approve tokens to |

> The frontend approve target and backend spender may differ if using a proxy/multisig setup.

---

## Approving Tokens

Users must approve tokens before making API calls. There are three ways:

### Option A: YYClaw Dashboard (Recommended)

1. Go to `https://your-domain.com/dashboard`
2. Connect wallet
3. Sign in
4. Select chain and token
5. Enter amount → Click **Approve**
6. Confirm in wallet

### Option B: Programmatically (ethers.js)

```javascript
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const tokenAddress = '0x55d398326f99059ff775485246999027b3197955'; // USDT on BSC
const spenderAddress = '0x7d7eECB98011AdE40bBA86598fd399F224DEd0B2';
const amount = ethers.parseUnits('100', 18); // 100 USDT

const token = new ethers.Contract(tokenAddress, [
  'function approve(address spender, uint256 amount) returns (bool)'
], signer);

const tx = await token.approve(spenderAddress, amount);
await tx.wait();
console.log('Approved!', tx.hash);
```

### Option C: Block Explorer

1. Go to [BscScan](https://bscscan.com) or [BaseScan](https://basescan.org)
2. Find the token contract
3. Go to **Write Contract** → Connect wallet
4. Call `approve(spender, amount)`
   - `spender`: `0x7d7eECB98011AdE40bBA86598fd399F224DEd0B2`
   - `amount`: amount in wei (e.g. `100000000000000000000` for 100 tokens with 18 decimals)

---

## Revoking Approval

Users can revoke their approval at any time, which immediately prevents future charges.

### Via Dashboard

Click **Revoke** next to the token on the dashboard.

### Via Code

```javascript
await token.approve(spenderAddress, 0); // Set allowance to 0
```

### Via Block Explorer

Call `approve(spender, 0)` on the token contract.

---

## x402 Protocol Support

YYClaw also supports the [x402 payment protocol](https://www.x402.org/) for standards-compliant HTTP 402 payment flows.

When a request arrives at `/v1/chat/completions` without sufficient allowance, the gateway can return a structured 402 response:

```json
{
  "error": "Payment Required",
  "x402": {
    "version": "2",
    "chain": "bsc",
    "chainId": 56,
    "payTo": "0xfc625b2afee95dccc219a91d8bf391398cbeec35",
    "priceUsd": 0.02,
    "defaultToken": "USD1",
    "tokens": [
      {
        "symbol": "USD1",
        "address": "0x8d0d...",
        "decimals": 18,
        "amount": "20000000000000000",
        "amountHuman": "0.0200",
        "method": "permit2"
      }
    ],
    "instructions": "Sign payment with your wallet using x402 protocol."
  }
}
```

Clients that support x402 can use this response to construct and sign a payment automatically.

---

## Security Considerations

- **No custody** — YYClaw never holds user funds. Tokens remain in the user's wallet.
- **Bounded risk** — Users control exactly how much they authorize. Approve $10 = max $10 can be charged.
- **Instant revocation** — Setting allowance to 0 immediately stops all charges.
- **Transparent** — Every charge is an on-chain transaction with a verifiable tx hash.
- **Gas costs** — Each `transferFrom` costs gas (paid by the spender wallet). Keep the spender funded.
