# Admin Guide

The YYClaw admin panel lets you manage models, users, view analytics, and monitor API call logs.

---

## Accessing the Admin Panel

The admin panel runs on a separate port (default `:6701`) or is served by the gateway at `/admin`.

```
http://localhost:6701          # Standalone admin server
http://localhost:6700/admin    # Served by gateway
```

### Authentication

All admin API endpoints require the `X-Admin-Key` header:

```
X-Admin-Key: your-admin-password
```

This is set via the `ADMIN_KEY` environment variable in `.env`.

---

## Model Management

### Viewing Models

The Models page shows all registered models with their configuration:

| Field | Description |
|-------|-------------|
| `name` | Internal model name (e.g. `gemini-3-flash-fixed`) |
| `upstream_url` | Provider's API base URL |
| `upstream_key` | API key for the provider |
| `upstream_model` | Model name the provider expects |
| `price_per_call` | Price in USD charged per API call |
| `enabled` | Whether the model is available to users |

### Adding a New Model

```
POST /admin/api/models
X-Admin-Key: your-admin-password
Content-Type: application/json

{
  "name": "gpt-4o-fixed",
  "upstream_url": "https://api.openai.com/v1",
  "upstream_key": "sk-xxx",
  "upstream_model": "gpt-4o",
  "price_per_call": 0.05
}
```

**Naming convention:** Model names should end with `-fixed`. The gateway auto-appends `-fixed` when users send requests without it, so `gpt-4o` maps to `gpt-4o-fixed`.

### Updating a Model

```
PUT /admin/api/models/:id
X-Admin-Key: your-admin-password
Content-Type: application/json

{
  "upstream_url": "https://api.openai.com/v1",
  "upstream_key": "sk-new-key",
  "upstream_model": "gpt-4o",
  "price_per_call": 0.06,
  "enabled": true
}
```

### Deleting a Model

```
DELETE /admin/api/models/:id
X-Admin-Key: your-admin-password
```

### Disabling a Model

Set `enabled: false` via PUT. Disabled models return 404 to API callers.

---

## User Management

### Viewing Users

The Users page shows all registered users:

| Field | Description |
|-------|-------------|
| `id` | Internal user ID |
| `wallet_address` | EVM wallet address |
| `balance` | Legacy balance field (actual balance is on-chain) |
| `api_key` | User's API key (`sk-yy-...`) |
| `created_at` | Registration timestamp |

### Manual Top-up

Add balance to a user's account (legacy feature, primarily for testing):

```
POST /admin/api/users/:id/topup
X-Admin-Key: your-admin-password
Content-Type: application/json

{
  "amount": 10.0
}
```

---

## Analytics

### Global Stats

```
GET /admin/api/stats
X-Admin-Key: your-admin-password
```

Response:
```json
{
  "total_calls": 1542,
  "total_revenue": 48.26,
  "today_calls": 87,
  "today_revenue": 2.14,
  "total_users": 23
}
```

| Metric | Description |
|--------|-------------|
| `total_calls` | All-time successful API calls |
| `total_revenue` | All-time revenue in USD |
| `today_calls` | Calls in the last 24 hours |
| `today_revenue` | Revenue in the last 24 hours |
| `total_users` | Total registered users |

### Call Logs

```
GET /admin/api/logs
X-Admin-Key: your-admin-password
```

Returns the last 100 call logs with user wallet addresses:

```json
[
  {
    "id": 1542,
    "wallet_address": "0xabc...def",
    "model": "gemini-3-flash-fixed",
    "cost": 0.02,
    "status": "success:0xTxHash...",
    "created_at": 1710000000
  }
]
```

---

## Admin API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/api/models` | List all models |
| `POST` | `/admin/api/models` | Create a model |
| `PUT` | `/admin/api/models/:id` | Update a model |
| `DELETE` | `/admin/api/models/:id` | Delete a model |
| `GET` | `/admin/api/users` | List all users |
| `POST` | `/admin/api/users/:id/topup` | Add balance to user |
| `GET` | `/admin/api/stats` | Global statistics |
| `GET` | `/admin/api/logs` | Recent call logs |

---

## Admin Frontend

The admin frontend is a React SPA built with Vite.

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/` | Admin key authentication |
| Dashboard | `/dashboard` | Revenue overview, call volume, user count |
| Models | `/models` | CRUD table for model configuration |
| Users | `/users` | User list with wallet addresses and API keys |
| Logs | `/logs` | Real-time call log viewer with status indicators |

### Building the Admin Frontend

```bash
cd admin-react
npm install
npm run build
# Output: ../admin-dist/
```

The built files are served by the gateway at `/admin/*`.

---

## Security Recommendations

1. **Restrict admin access** — In production, limit admin panel access to internal networks or VPN:

```nginx
location /admin {
    allow 10.0.0.0/8;
    allow 192.168.0.0/16;
    deny all;
    proxy_pass http://127.0.0.1:6700;
}
```

2. **Use a strong ADMIN_KEY** — At least 32 characters, randomly generated.

3. **Don't expose port 6701** — If using the standalone admin server, don't expose it to the internet.

4. **Rotate ADMIN_KEY periodically** — Update `.env` and restart the server.

5. **Monitor logs** — Check for unusual patterns (high error rates, unknown models, etc.).
