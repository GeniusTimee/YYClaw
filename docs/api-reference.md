# API Reference

Complete reference for all YYClaw HTTP endpoints.

Base URL: `https://your-domain.com` (or `http://localhost:6700` for local dev)

---

## Authentication

### Get Login Nonce

```
GET /api/auth/nonce?address=0x...
```

Request a one-time nonce for wallet signature authentication.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | string | Yes | EVM wallet address (checksummed or lowercase) |

**Response `200`:**
```json
{
  "nonce": "9a4dfbf4-cdae-4472-81d9-02a059d78381"
}
```

**Errors:**
- `400` — address not provided

---

### Verify Signature

```
POST /api/auth/verify
```

Verify an EIP-191 signed message and receive a JWT token + API key.

**Request Body:**
```json
{
  "address": "0xYourWalletAddress",
  "signature": "0xSignedMessageHex..."
}
```

**Message format the user must sign:**
```
YYClaw Login
Address: 0xYourWalletAddress
Nonce: 9a4dfbf4-cdae-4472-81d9-02a059d78381
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "apiKey": "sk-yy-a1b2c3d4e5f6...",
  "balance": 0
}
```

| Field | Description |
|-------|-------------|
| `token` | JWT valid for 7 days. Used for billing/auth endpoints. |
| `apiKey` | Permanent API key for `/v1/*` endpoints. Format: `sk-yy-{uuid}` |
| `balance` | Legacy field (balance is now on-chain allowance) |

**Errors:**
- `400` — missing address/signature, or nonce not found
- `401` — signature verification failed

**Notes:**
- Nonces are single-use — deleted after successful verification
- If the wallet address is new, a user record + API key are auto-created
- If the wallet already exists, the existing API key is returned

---

### Get Current User

```
GET /api/auth/me
```

Returns the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response `200`:**
```json
{
  "id": 1,
  "wallet_address": "0xabc...def",
  "balance": 0,
  "api_key": "sk-yy-a1b2c3d4...",
  "created_at": 1710000000
}
```

**Errors:**
- `401` — missing or invalid JWT
- `404` — user not found

---

## Chat Completions

### Create Chat Completion

```
POST /v1/chat/completions
```

OpenAI-compatible chat completion endpoint. Proxies to the configured upstream provider.

**Headers:**
```
Authorization: Bearer sk-yy-YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "model": "gemini-3-flash",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Explain quantum computing in simple terms."}
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 1024
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | Model name (with or without `-fixed` suffix) |
| `messages` | array | Yes | Array of message objects with `role` and `content` |
| `stream` | boolean | No | Enable SSE streaming (default: `false`) |
| `temperature` | number | No | Sampling temperature (passed to upstream) |
| `max_tokens` | number | No | Max output tokens (passed to upstream) |

> All additional fields are passed through to the upstream provider unchanged.

**Response `200` (non-streaming):**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "model": "gemini-3-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Quantum computing uses quantum bits..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 156,
    "total_tokens": 180
  }
}
```

**Response (streaming):**

Content-Type: `text/event-stream`

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"Quantum"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":" computing"},"finish_reason":null}]}

data: [DONE]
```

**Request Lifecycle:**

1. **Validate API key** → look up user in `users` table
2. **Resolve model** → if model name doesn't end with `-fixed`, append it automatically
3. **Pre-flight check** → read on-chain allowance + balance across BSC and Base
4. **Proxy to upstream** → forward request to configured `upstream_url` with `upstream_key`
5. **Charge on success** → execute `transferFrom` to collect payment from user's wallet
6. **Log the call** → insert into `call_logs` with status and tx hash

**Error Responses:**

| Status | Type | When |
|--------|------|------|
| `400` | `invalid_request` | Missing `model` field |
| `401` | `auth_error` | Missing or invalid API key |
| `402` | `payment_error` | Insufficient allowance or token balance |
| `404` | `invalid_request` | Model not found or not enabled |
| `503` | `service_error` | Model exists but `upstream_url` or `upstream_key` not configured |
| `5xx` | `upstream_error` | Upstream provider returned an error (status passed through) |

**402 Response:**
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

## Models

### List Models

```
GET /v1/models
```

Returns all enabled models with pricing. **No authentication required.**

**Response `200`:**
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
    },
    {
      "id": "claude-sonnet-4-6",
      "object": "model",
      "created": 1700000000,
      "owned_by": "yyclaw",
      "price_per_call": 0.1
    }
  ]
}
```

> The `-fixed` suffix is stripped from model IDs in the response.

---

## Billing

All billing endpoints require JWT authentication.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

### Get Balance

```
GET /api/billing/balance
```

Returns the user's total on-chain allowance across all tokens on BSC + Base.

**Response `200`:**
```json
{
  "balance": 150.50
}
```

> This is the sum of all ERC20 allowances granted to the spender address, not a platform-held balance.

---

### Get Call Logs

```
GET /api/billing/logs
```

Returns the last 50 API call logs for the authenticated user.

**Response `200`:**
```json
[
  {
    "model": "gemini-3-flash-fixed",
    "cost": 0.02,
    "status": "success:0xabc123...",
    "created_at": 1710000000
  },
  {
    "model": "claude-sonnet-4-6-fixed",
    "cost": 0.10,
    "status": "upstream_error",
    "created_at": 1709999000
  }
]
```

**Status Values:**

| Status | Description |
|--------|-------------|
| `success:0xTxHash` | Call succeeded, payment collected on-chain |
| `charge_failed_after_use` | Upstream succeeded but `transferFrom` failed (debt logged) |
| `no_allowance` | Pre-flight check failed — insufficient allowance/balance |
| `upstream_error` | Upstream provider returned an error (user not charged) |
| `upstream_stream_error` | Streaming connection broke mid-response |

---

### Get Usage Stats

```
GET /api/billing/stats
```

Returns aggregated usage statistics (successful calls only).

**Response `200`:**
```json
{
  "total_calls": 142,
  "total_spent": 4.28
}
```

---

## Token List

### Get Supported Tokens

```
GET /api/tokens?chain=bsc
```

Returns supported payment tokens for a given chain.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `chain` | string | `bsc` | Chain identifier: `bsc` or `base` |

**Response `200`:**
```json
{
  "chain": "bsc",
  "tokens": [
    {"symbol": "USD1", "address": "0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d", "decimals": 18},
    {"symbol": "USDT", "address": "0x55d398326f99059ff775485246999027b3197955", "decimals": 18},
    {"symbol": "USDC", "address": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", "decimals": 18}
  ]
}
```

---

## Rate Limits

YYClaw does not impose rate limits by default. Rate limiting depends on:

1. **Upstream provider limits** — each provider has its own rate limits
2. **On-chain throughput** — `transferFrom` transactions take ~3-15 seconds to confirm
3. **Your server resources** — Node.js single-thread, scale with PM2 or multiple instances

For production, consider adding rate limiting via nginx or express-rate-limit.
