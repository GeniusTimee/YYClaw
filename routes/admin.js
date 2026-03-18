const express = require('express');
const router = express.Router();
const db = require('../db');

const ADMIN_KEY = process.env.ADMIN_KEY || 'yyclaw-admin-2024';

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// GET /admin/api/models
router.get('/models', requireAdmin, (req, res) => {
  const models = db.prepare('SELECT * FROM models ORDER BY name').all();
  res.json(models);
});

// PUT /admin/api/models/:id
router.put('/models/:id', requireAdmin, (req, res) => {
  const { upstream_url, upstream_key, upstream_model, price_per_call, enabled } = req.body;
  db.prepare(`UPDATE models SET upstream_url=?, upstream_key=?, upstream_model=?, price_per_call=?, enabled=? WHERE id=?`)
    .run(upstream_url, upstream_key, upstream_model, price_per_call, enabled ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// POST /admin/api/models
router.post('/models', requireAdmin, (req, res) => {
  const { name, upstream_url, upstream_key, upstream_model, price_per_call } = req.body;
  try {
    db.prepare('INSERT INTO models (name, upstream_url, upstream_key, upstream_model, price_per_call) VALUES (?,?,?,?,?)')
      .run(name, upstream_url || '', upstream_key || '', upstream_model || '', price_per_call || 0);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /admin/api/models/:id
router.delete('/models/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM models WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /admin/api/users
router.get('/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, wallet_address, balance, api_key, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// POST /admin/api/users/:id/topup
router.post('/users/:id/topup', requireAdmin, (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount)) return res.status(400).json({ error: 'invalid amount' });
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(parseFloat(amount), req.params.id);
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.params.id);
  res.json({ ok: true, balance: user.balance });
});

// GET /admin/api/stats
router.get('/stats', requireAdmin, (req, res) => {
  const today = Math.floor(Date.now() / 1000) - 86400;
  const total = db.prepare("SELECT COUNT(*) as calls, SUM(cost) as revenue FROM call_logs WHERE status = 'success'").get();
  const todayStats = db.prepare("SELECT COUNT(*) as calls, SUM(cost) as revenue FROM call_logs WHERE status = 'success' AND created_at > ?").get(today);
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  res.json({
    total_calls: total.calls || 0,
    total_revenue: total.revenue || 0,
    today_calls: todayStats.calls || 0,
    today_revenue: todayStats.revenue || 0,
    total_users: users.count || 0
  });
});

// GET /admin/api/logs
router.get('/logs', requireAdmin, (req, res) => {
  const logs = db.prepare(`
    SELECT cl.id, u.wallet_address, cl.model, cl.cost, cl.status, cl.created_at
    FROM call_logs cl LEFT JOIN users u ON cl.user_id = u.id
    ORDER BY cl.created_at DESC LIMIT 100
  `).all();
  res.json(logs);
});

module.exports = router;
module.exports.requireAdmin = requireAdmin;
