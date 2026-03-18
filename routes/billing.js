const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireJWT } = require('./auth');
const { getAllowance } = require('../lib/onchain');

// GET /api/billing/balance — returns on-chain allowance as balance
router.get('/balance', requireJWT, async (req, res) => {
  const user = db.prepare('SELECT wallet_address FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.json({ balance: 0 });

  let totalAllowance = 0;
  try {
    const bscAllowance = await getAllowance('bsc', user.wallet_address);
    const baseAllowance = await getAllowance('base', user.wallet_address);
    totalAllowance = bscAllowance + baseAllowance;
  } catch {}

  res.json({ balance: totalAllowance });
});

// GET /api/billing/logs
router.get('/logs', requireJWT, (req, res) => {
  const logs = db.prepare(
    'SELECT model, cost, status, created_at FROM call_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.userId);
  res.json(logs);
});

// GET /api/billing/stats — only count successful calls
router.get('/stats', requireJWT, (req, res) => {
  const total = db.prepare(
    "SELECT COUNT(*) as calls, COALESCE(SUM(cost), 0) as spent FROM call_logs WHERE user_id = ? AND status LIKE 'success%'"
  ).get(req.userId);
  res.json({ total_calls: total.calls || 0, total_spent: total.spent || 0 });
});

module.exports = router;
