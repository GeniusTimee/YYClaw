const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const { autoCharge } = require('../lib/onchain');

// Middleware: verify API key
function requireApiKey(req, res, next) {
  const auth = req.headers.authorization;
  const key = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!key) return res.status(401).json({ error: { message: 'API key required', type: 'auth_error' } });
  const user = db.prepare('SELECT * FROM users WHERE api_key = ?').get(key);
  if (!user) return res.status(401).json({ error: { message: 'Invalid API key', type: 'auth_error' } });
  req.user = user;
  next();
}

// POST /v1/chat/completions
router.post('/chat/completions', requireApiKey, async (req, res) => {
  const { model, stream } = req.body;
  if (!model) return res.status(400).json({ error: { message: 'model required', type: 'invalid_request' } });

  const modelRow = db.prepare('SELECT * FROM models WHERE name = ? AND enabled = 1').get(model);
  if (!modelRow) return res.status(404).json({ error: { message: `Model ${model} not found`, type: 'invalid_request' } });
  if (!modelRow.upstream_url || !modelRow.upstream_key) {
    return res.status(503).json({ error: { message: 'Model not configured', type: 'service_error' } });
  }

  const price = modelRow.price_per_call;
  const userAddress = req.user.wallet_address;

  // ── On-chain charge via transferFrom ──────────────────
  const chargeResult = await autoCharge(userAddress, price);
  if (!chargeResult.success) {
    logCall(req.user.id, model, price, 'charge_failed');
    return res.status(402).json({
      error: {
        message: `Payment failed: ${chargeResult.error}`,
        type: 'payment_error',
        required: price,
        hint: 'Approve tokens to the spender address on BSC or Base, then retry.',
      }
    });
  }

  // ── Forward to upstream ───────────────────────────────
  const upstreamBody = { ...req.body, model: modelRow.upstream_model || model };

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const upstream = await axios.post(
        `${modelRow.upstream_url}/chat/completions`,
        upstreamBody,
        { headers: { 'Authorization': `Bearer ${modelRow.upstream_key}`, 'Content-Type': 'application/json' }, responseType: 'stream' }
      );
      upstream.data.pipe(res);
      upstream.data.on('end', () => {
        logCall(req.user.id, model, price, 'success', chargeResult.txHash);
      });
      upstream.data.on('error', () => {
        // Upstream failed after charge — log but don't refund (tx already on-chain)
        logCall(req.user.id, model, price, 'upstream_error', chargeResult.txHash);
      });
    } else {
      const upstream = await axios.post(
        `${modelRow.upstream_url}/chat/completions`,
        upstreamBody,
        { headers: { 'Authorization': `Bearer ${modelRow.upstream_key}`, 'Content-Type': 'application/json' } }
      );
      logCall(req.user.id, model, price, 'success', chargeResult.txHash);
      res.json(upstream.data);
    }
  } catch (e) {
    // Upstream error after successful charge — log it
    logCall(req.user.id, model, price, 'upstream_error', chargeResult.txHash);
    const status = e.response?.status || 500;
    res.status(status).json({ error: { message: e.response?.data?.error?.message || e.message, type: 'upstream_error' } });
  }
});

// GET /v1/models
router.get('/models', (req, res) => {
  const models = db.prepare('SELECT name, price_per_call FROM models WHERE enabled = 1').all();
  res.json({
    object: 'list',
    data: models.map(m => ({
      id: m.name,
      object: 'model',
      created: 1700000000,
      owned_by: 'yyclaw',
      price_per_call: m.price_per_call
    }))
  });
});

function logCall(userId, model, cost, status, txHash) {
  db.prepare('INSERT INTO call_logs (user_id, model, cost, status) VALUES (?, ?, ?, ?)').run(
    userId || null, model, cost, status + (txHash ? ':' + txHash : '')
  );
}

module.exports = router;
