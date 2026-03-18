const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'yyclaw-secret-change-me';

// GET /api/auth/nonce?address=0x...
router.get('/nonce', (req, res) => {
  const address = req.query.address?.toLowerCase();
  if (!address) return res.status(400).json({ error: 'address required' });
  const nonce = uuidv4();
  db.prepare('INSERT OR REPLACE INTO nonces (address, nonce) VALUES (?, ?)').run(address, nonce);
  res.json({ nonce });
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ error: 'address and signature required' });
    const addr = address.toLowerCase();
    const row = db.prepare('SELECT nonce FROM nonces WHERE address = ?').get(addr);
    if (!row) return res.status(400).json({ error: 'nonce not found, request a new one' });

    const message = `YYClaw Login\nAddress: ${address}\nNonce: ${row.nonce}`;
    const recovered = ethers.verifyMessage(message, signature).toLowerCase();
    if (recovered !== addr) return res.status(401).json({ error: 'invalid signature' });

    // Delete used nonce
    db.prepare('DELETE FROM nonces WHERE address = ?').run(addr);

    // Upsert user
    let user = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(addr);
    if (!user) {
      const apiKey = 'sk-yy-' + uuidv4().replace(/-/g, '');
      db.prepare('INSERT INTO users (wallet_address, api_key) VALUES (?, ?)').run(addr, apiKey);
      user = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(addr);
    }

    const token = jwt.sign({ userId: user.id, address: addr }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, apiKey: user.api_key, balance: user.balance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me  (requires JWT)
router.get('/me', requireJWT, (req, res) => {
  const user = db.prepare('SELECT id, wallet_address, balance, api_key, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json(user);
});

function requireJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = router;
module.exports.requireJWT = requireJWT;
