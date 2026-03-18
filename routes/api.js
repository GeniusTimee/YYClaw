const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const { x402ForModel, verifyBscPayment, getBnbPrice } = require('./x402');

// Middleware: verify API key (for pre-paid balance mode)
function requireApiKey(req, res, next) {
  const auth = req.headers.authorization;
  const key = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!key) return res.status(401).json({ error: { message: 'API key required', type: 'auth_error' } });
  const user = db.prepare('SELECT * FROM users WHERE api_key = ?').get(key);
  if (!user) return res.status(401).json({ error: { message: 'Invalid API key', type: 'auth_error' } });
  req.user = user;
  next();
}

// Detect payment mode:
// - x-payment-chain header present → x402 mode (no API key needed)
// - Authorization: Bearer sk-yy-... → pre-paid balance mode
function detectPaymentMode(req, res, next) {
  const chain = req.headers['x-payment-chain'];
  const auth = req.headers.authorization;
  const key = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (chain) {
    // x402 mode
    req.paymentMode = 'x402';
    req.x402Chain = chain;
    return next();
  }

  if (key) {
    // Pre-paid balance mode
    const user = db.prepare('SELECT * FROM users WHERE api_key = ?').get(key);
    if (!user) return res.status(401).json({ error: { message: 'Invalid API key', type: 'auth_error' } });
    req.paymentMode = 'balance';
    req.user = user;
    return next();
  }

  // No auth at all — return 402 with both options
  res.status(402).json({
    error: {
      message: 'Payment required. Use API key (pre-paid balance) or x402 (per-call chain payment).',
      type: 'payment_required'
    },
    options: {
      balance: 'Set Authorization: Bearer sk-yy-<your-key> header',
      x402_base: 'Set X-Payment-Chain: base and X-Payment: <usdc-proof> headers',
      x402_bsc: 'Set X-Payment-Chain: bsc and X-Payment: <bnb-txhash> headers'
    }
  });
}

// POST /v1/chat/completions
router.post('/chat/completions', detectPaymentMode, async (req, res) => {
  const { model, stream } = req.body;
  if (!model) return res.status(400).json({ error: { message: 'model required', type: 'invalid_request' } });

  const modelRow = db.prepare('SELECT * FROM models WHERE name = ? AND enabled = 1').get(model);
  if (!modelRow) return res.status(404).json({ error: { message: `Model ${model} not found`, type: 'invalid_request' } });
  if (!modelRow.upstream_url || !modelRow.upstream_key) {
    return res.status(503).json({ error: { message: 'Model not configured', type: 'service_error' } });
  }

  const price = modelRow.price_per_call;

  // ── Payment verification ──────────────────────────────
  if (req.paymentMode === 'x402') {
    const chain = req.x402Chain;
    const paymentProof = req.headers['x-payment'];

    if (!paymentProof) {
      // Return 402 with payment instructions
      const bnbPrice = await getBnbPrice();
      return res.status(402).json({
        error: 'Payment Required',
        model,
        x402: {
          chains: {
            base: {
              payTo: process.env.PAYMENT_ADDRESS || '0xfc625b2afee95dccc219a91d8bf391398cbeec35',
              amountUsdc: (price * 1_000_000).toFixed(0),
              amountUsd: price,
              token: 'USDC',
              tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              network: 'base-mainnet',
              decimals: 6
            },
            bsc: {
              payTo: process.env.PAYMENT_ADDRESS || '0xfc625b2afee95dccc219a91d8bf391398cbeec35',
              amountBnb: (price / bnbPrice).toFixed(8),
              amountUsd: price,
              bnbPrice,
              token: 'BNB',
              network: 'bsc-mainnet'
            }
          },
          instructions: 'Send payment then retry with X-Payment-Chain: base|bsc and X-Payment: <txhash_or_proof> headers'
        }
      });
    }

    if (chain === 'bsc') {
      const bnbPrice = await getBnbPrice();
      const expectedBnb = price / bnbPrice;
      const result = await verifyBscPayment(paymentProof, expectedBnb, req.headers['x-payment-from']);
      if (!result.valid) {
        return res.status(402).json({ error: { message: 'BSC payment verification failed', reason: result.error, type: 'payment_error' } });
      }
    }
    // Base chain: trust the x402 proof header (full verification via @x402/express would be added in production)
    // For now log it
    logCall(null, model, price, 'success', chain);

  } else {
    // Balance mode
    const user = req.user;
    if (user.balance < price) {
      return res.status(402).json({
        error: {
          message: `Insufficient balance. Required: $${price.toFixed(4)}, Available: $${user.balance.toFixed(4)}`,
          type: 'insufficient_balance',
          required: price,
          available: user.balance
        }
      });
    }
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(price, user.id);
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
      upstream.data.on('end', () => { if (req.paymentMode === 'balance') logCall(req.user.id, model, price, 'success', 'balance'); });
      upstream.data.on('error', () => {
        if (req.paymentMode === 'balance') db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(price, req.user.id);
        logCall(req.user?.id, model, price, 'error', req.paymentMode);
      });
    } else {
      const upstream = await axios.post(
        `${modelRow.upstream_url}/chat/completions`,
        upstreamBody,
        { headers: { 'Authorization': `Bearer ${modelRow.upstream_key}`, 'Content-Type': 'application/json' } }
      );
      if (req.paymentMode === 'balance') logCall(req.user.id, model, price, 'success', 'balance');
      res.json(upstream.data);
    }
  } catch (e) {
    if (req.paymentMode === 'balance') db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(price, req.user.id);
    logCall(req.user?.id, model, price, 'error', req.paymentMode);
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

function logCall(userId, model, cost, status, chain) {
  db.prepare('INSERT INTO call_logs (user_id, model, cost, status) VALUES (?, ?, ?, ?)').run(userId || null, model, cost, status + (chain ? ':' + chain : ''));
}

module.exports = router;
