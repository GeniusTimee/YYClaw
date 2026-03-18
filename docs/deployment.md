# Deployment Guide

Production deployment guide for YYClaw — covering reverse proxy, process management, Docker, and security hardening.

---

## Architecture Overview

```
Internet
    │
    ▼
┌─────────────────┐
│  Nginx / Caddy  │  ← HTTPS termination, rate limiting
│  (reverse proxy) │
└────────┬────────┘
         │ :6700
         ▼
┌─────────────────┐
│  YYClaw Gateway │  ← Express.js (API + frontend + admin)
│  (Node.js)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 SQLite    On-Chain
 (local)   (BSC/Base RPC)
```

For most deployments, a single Node.js process behind nginx is sufficient. YYClaw is lightweight — the main bottleneck is upstream AI provider latency, not the gateway itself.

---

## Pre-Deployment Checklist

- [ ] Node.js ≥ 25 installed
- [ ] `npm install` completed
- [ ] Frontend built: `cd frontend-react && npm ci && npm run build`
- [ ] Admin frontend built: `cd admin-react && npm ci && npm run build`
- [ ] `.env` configured with production values
- [ ] `JWT_SECRET` set to a strong random string (≥64 chars)
- [ ] `ADMIN_KEY` set to a strong password (≥32 chars)
- [ ] `SPENDER_PRIVATE_KEY` set to a dedicated hot wallet
- [ ] Spender wallet funded with gas (BNB on BSC, ETH on Base)
- [ ] Upstream models configured in admin panel
- [ ] HTTPS configured via reverse proxy
- [ ] Domain DNS pointing to your server

---

## Building for Production

```bash
# Install backend dependencies
npm ci --production

# Build user frontend
cd frontend-react
npm ci
npm run build    # Output → ../frontend-dist/
cd ..

# Build admin frontend
cd admin-react
npm ci
npm run build    # Output → ../admin-dist/
cd ..
```

---

## Process Management

### Option A: systemd (Recommended for Linux)

Create `/etc/systemd/system/yyclaw.service`:

```ini
[Unit]
Description=YYClaw AI Gateway
After=network.target

[Service]
Type=simple
User=yyclaw
Group=yyclaw
WorkingDirectory=/opt/yyclaw
ExecStart=/usr/bin/node --experimental-sqlite server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/opt/yyclaw/.env

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/yyclaw

# Resource limits
LimitNOFILE=65536
MemoryMax=512M

[Install]
WantedBy=multi-user.target
```

```bash
# Create service user
sudo useradd -r -s /bin/false yyclaw

# Set ownership
sudo chown -R yyclaw:yyclaw /opt/yyclaw

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable yyclaw
sudo systemctl start yyclaw

# Check status
sudo systemctl status yyclaw

# View logs
sudo journalctl -u yyclaw -f
```

### Option B: PM2

```bash
npm install -g pm2

# Start
pm2 start server.js --name yyclaw --node-args="--experimental-sqlite"

# Auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit

# Logs
pm2 logs yyclaw
```

### Option C: start.sh (Development / Simple)

```bash
./start.sh    # Starts both gateway and admin as background processes
./stop.sh     # Stops both
```

> Not recommended for production — no auto-restart, no log management.

---

## Reverse Proxy

### Nginx

```nginx
# /etc/nginx/sites-available/yyclaw
server {
    listen 80;
    server_name crypto.yyclaw.cc;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crypto.yyclaw.cc;

    # SSL (Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/crypto.yyclaw.cc/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crypto.yyclaw.cc/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gateway (main)
    location / {
        proxy_pass http://127.0.0.1:6700;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE streaming support
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 120s;
        chunked_transfer_encoding on;
    }

    # Admin panel — restrict to internal IPs
    location /admin {
        # Uncomment to restrict access:
        # allow 10.0.0.0/8;
        # allow 192.168.0.0/16;
        # deny all;

        proxy_pass http://127.0.0.1:6700;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Rate limiting for API
    location /v1/ {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://127.0.0.1:6700;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}

# Rate limit zone (add to http block in nginx.conf)
# limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/yyclaw /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL cert
sudo certbot --nginx -d crypto.yyclaw.cc
```

### Caddy (Simpler Alternative)

```
# /etc/caddy/Caddyfile
crypto.yyclaw.cc {
    reverse_proxy localhost:6700 {
        flush_interval -1    # Required for SSE streaming
    }
}
```

```bash
sudo systemctl restart caddy
```

Caddy handles HTTPS automatically via Let's Encrypt.

---

## Docker

### Dockerfile

```dockerfile
FROM node:25-slim

WORKDIR /app

# Install backend dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Build frontends
RUN cd frontend-react && npm ci && npm run build && cd .. && \
    cd admin-react && npm ci && npm run build && cd ..

EXPOSE 6700

HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost:6700/v1/models || exit 1

CMD ["node", "--experimental-sqlite", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  yyclaw:
    build: .
    container_name: yyclaw
    restart: always
    ports:
      - "6700:6700"
    env_file:
      - .env
    volumes:
      - ./yyclaw.db:/app/yyclaw.db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6700/v1/models"]
      interval: 30s
      timeout: 5s
      retries: 3
```

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f yyclaw

# Stop
docker compose down
```

### Persistent Data

The only file that needs persistence is `yyclaw.db` (SQLite database). Mount it as a volume:

```bash
docker run -d \
  --name yyclaw \
  -p 6700:6700 \
  --env-file .env \
  -v /data/yyclaw/yyclaw.db:/app/yyclaw.db \
  yyclaw
```

---

## Environment Security

### Generate Strong Secrets

```bash
# JWT_SECRET (64 chars)
openssl rand -hex 32

# ADMIN_KEY (32 chars)
openssl rand -base64 24
```

### Protect the .env File

```bash
chmod 600 .env
chown yyclaw:yyclaw .env
```

### Spender Wallet Best Practices

1. **Use a dedicated hot wallet** — never use your main wallet
2. **Minimal gas balance** — keep only enough BNB/ETH for ~1000 transactions
3. **Monitor balance** — set up alerts when gas drops below threshold
4. **No other assets** — the spender wallet should only hold gas tokens
5. **Backup the key** — store `SPENDER_PRIVATE_KEY` in a secure vault

### Gas Estimation

Each `transferFrom` costs approximately:
- BSC: ~0.0003 BNB (~$0.18 at $600/BNB)
- Base: ~0.00005 ETH (~$0.15 at $3000/ETH)

For 1000 API calls/day:
- BSC: ~0.3 BNB/day
- Base: ~0.05 ETH/day

---

## Monitoring

### Health Check

```bash
# Simple health check
curl -f http://localhost:6700/v1/models

# Check from outside
curl -f https://crypto.yyclaw.cc/v1/models
```

### Log Monitoring

```bash
# systemd
journalctl -u yyclaw -f

# PM2
pm2 logs yyclaw

# Docker
docker logs -f yyclaw
```

### Database Queries

```bash
# Total calls today
sqlite3 yyclaw.db "SELECT COUNT(*) FROM call_logs WHERE created_at > unixepoch() - 86400;"

# Revenue today
sqlite3 yyclaw.db "SELECT SUM(cost) FROM call_logs WHERE status LIKE 'success%' AND created_at > unixepoch() - 86400;"

# Failed charges (potential debt)
sqlite3 yyclaw.db "SELECT COUNT(*), SUM(cost) FROM call_logs WHERE status LIKE 'charge_failed%';"

# Top users
sqlite3 yyclaw.db "SELECT u.wallet_address, COUNT(*) as calls, SUM(cl.cost) as spent FROM call_logs cl JOIN users u ON cl.user_id = u.id GROUP BY u.wallet_address ORDER BY spent DESC LIMIT 10;"
```

### Spender Wallet Balance

```bash
# Check BNB balance (BSC)
curl -s -X POST https://bsc-dataseed.binance.org/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xfc625b2afee95dccc219a91d8bf391398cbeec35","latest"],"id":1}' \
  | jq -r '.result' | xargs printf "%d\n" | awk '{print $1/1e18 " BNB"}'
```

---

## Backup

### Database Backup

```bash
# Simple copy (while server is running — SQLite handles this safely)
cp yyclaw.db yyclaw.db.backup.$(date +%Y%m%d)

# Automated daily backup (crontab)
0 3 * * * cp /opt/yyclaw/yyclaw.db /backups/yyclaw.db.$(date +\%Y\%m\%d)
```

### Full Backup

```bash
tar czf yyclaw-backup-$(date +%Y%m%d).tar.gz \
  .env \
  yyclaw.db \
  skill/ \
  frontend-dist/ \
  admin-dist/
```

---

## Scaling

YYClaw is single-process by design. For most use cases, a single instance handles thousands of requests per day easily (the bottleneck is upstream AI latency, not the gateway).

If you need to scale:

1. **Vertical** — increase server RAM/CPU
2. **PM2 cluster** — `pm2 start server.js -i max` (requires shared DB, SQLite may need migration to PostgreSQL)
3. **Multiple instances** — run behind a load balancer with a shared PostgreSQL database (requires code changes to `db.js`)

For most deployments, a single $5-20/month VPS is more than sufficient.
