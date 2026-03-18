require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Admin Panel ───────────────────────────────────────────
// Admin API routes
app.use('/admin/api', require('./routes/admin'));
// Admin React SPA (static assets)
app.use('/admin', express.static(path.join(__dirname, 'admin-dist')));
// Admin SPA fallback (client-side routing)
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dist', 'index.html'));
});

// ─── Frontend ──────────────────────────────────────────────
// React build
app.use(express.static(path.join(__dirname, 'frontend-dist')));

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/billing', require('./routes/billing'));
app.use('/v1', require('./routes/api'));

// Token list for frontend
const { getTokensForChain } = require('./routes/x402');
app.get('/api/tokens', (req, res) => {
  const chain = (req.query.chain || 'bsc').toLowerCase();
  res.json({ chain, tokens: getTokensForChain(chain) });
});

// ─── SPA Fallback ──────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/v1') || req.path.startsWith('/admin')) {
    return res.status(404).json({ error: 'not found' });
  }
  res.sendFile(path.join(__dirname, 'frontend-dist', 'index.html'));
});

const PORT = process.env.PORT || 6700;
app.listen(PORT, () => console.log(`YYClaw Gateway running on http://localhost:${PORT}`));
