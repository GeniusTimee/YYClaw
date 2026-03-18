const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireJWT } = require('./auth');

// GET /api/billing/balance
router.get('/balance', requireJWT, (req, res) => {
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId);
  res.json({ balance: user?.balance || 0 });
});

// GET /api/billing/logs
router.get('/logs', requireJWT, (req, res) => {
  const logs = db.prepare(
    'SELECT model, cost, status, created_at FROM call_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.userId);
  res.json(logs);
});

// GET /api/billing/stats
router.get('/stats', requireJWT, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as calls, SUM(cost) as spent FROM call_logs WHERE user_id = ?').get(req.userId);
  res.json({ total_calls: total.calls || 0, total_spent: total.spent || 0 });
});

module.exports = router;
