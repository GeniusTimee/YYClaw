/**
 * x402 Payment Middleware for YYClaw v2
 * Uses @x402/express v2.7.0 with arbitrary ERC20 support
 * Supports: USD1 (BSC), USDT (BSC), USDC (BSC/Base)
 */

const { paymentMiddleware } = require('@x402/express');
const { evm } = require('@x402/evm');
const axios = require('axios');
const db = require('../db');

const PAYMENT_ADDRESS = process.env.PAYMENT_ADDRESS || '0xfc625b2afee95dccc219a91d8bf391398cbeec35';

// ─── Token Registry ────────────────────────────────────────
// All stablecoins pegged to $1, so amount = priceUsd * 10^decimals
const TOKENS = {
  // BSC (chainId: 56)
  bsc: {
    USD1: {
      address: '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d',
      decimals: 18,
      eip712: { name: 'USD1', version: '1' },
      assetTransferMethod: 'permit2',
    },
    USDT: {
      address: '0x55d398326f99059ff775485246999027b3197955',
      decimals: 18,
      eip712: { name: 'Tether USD', version: '1' },
      assetTransferMethod: 'permit2',
    },
    USDC: {
      address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      decimals: 18,
      eip712: { name: 'USD Coin', version: '2' },
      assetTransferMethod: 'permit2',
    },
  },
  // Base (chainId: 8453)
  base: {
    USDC: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      eip712: { name: 'USD Coin', version: '2' },
      assetTransferMethod: 'eip3009', // USDC on Base supports EIP-3009
    },
    USDbC: {
      address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
      decimals: 6,
      eip712: { name: 'USD Base Coin', version: '2' },
      assetTransferMethod: 'eip3009',
    },
  },
};

// ─── Network IDs ───────────────────────────────────────────
const NETWORK_IDS = { bsc: 56, base: 8453 };

// ─── Build route config for paymentMiddleware ──────────────
function buildRouteConfig(priceUsd, chain, tokenSymbol) {
  const chainTokens = TOKENS[chain] || TOKENS.bsc;
  const token = chainTokens[tokenSymbol] || chainTokens[Object.keys(chainTokens)[0]];
  const amount = BigInt(Math.ceil(priceUsd * 10 ** token.decimals)).toString();

  return {
    'POST /v1/chat/completions': {
      price: {
        amount,
        asset: {
          address: token.address,
          decimals: token.decimals,
          eip712: token.eip712,
        },
      },
      network: NETWORK_IDS[chain] || 56,
      extra: {
        assetTransferMethod: token.assetTransferMethod || 'permit2',
      },
    },
  };
}

// ─── Build 402 response with all supported tokens ─────────
async function build402Response(priceUsd, chain) {
  const chainTokens = TOKENS[chain] || TOKENS.bsc;
  const tokenList = Object.entries(chainTokens).map(([sym, info]) => ({
    symbol: sym,
    address: info.address,
    decimals: info.decimals,
    amount: BigInt(Math.ceil(priceUsd * 10 ** info.decimals)).toString(),
    amountHuman: priceUsd.toFixed(4),
    method: info.assetTransferMethod,
  }));

  return {
    error: 'Payment Required',
    x402: {
      version: '2',
      chain,
      chainId: NETWORK_IDS[chain] || 56,
      payTo: PAYMENT_ADDRESS,
      priceUsd,
      defaultToken: tokenList[0]?.symbol,
      tokens: tokenList,
      instructions: 'Sign payment with your wallet using x402 protocol. Default token: ' + tokenList[0]?.symbol,
    },
  };
}

// ─── Main Middleware Factory ───────────────────────────────
function x402ForModel(modelName) {
  return async (req, res, next) => {
    const model = modelName || req.body?.model;
    const modelRow = db.prepare('SELECT price_per_call FROM models WHERE name=? AND enabled=1').get(model);
    if (!modelRow) return next();

    const priceUsd = modelRow.price_per_call;
    const chain = (req.headers['x-payment-chain'] || 'bsc').toLowerCase();
    const tokenSymbol = (req.headers['x-payment-token'] || 'USD1').toUpperCase();

    // No payment header → return 402 with token options
    const paymentHeader = req.headers['x-payment'] || req.headers['payment-signature'];
    if (!paymentHeader) {
      return res.status(402).json(await build402Response(priceUsd, chain));
    }

    // Use official x402 middleware for verification
    const routes = buildRouteConfig(priceUsd, chain, tokenSymbol);
    const middleware = paymentMiddleware(routes, evm());

    return middleware(req, res, (err) => {
      if (err) return res.status(402).json({ error: 'Payment verification failed', reason: err.message });
      req.x402Paid = true;
      req.x402Chain = chain;
      req.x402Token = tokenSymbol;
      next();
    });
  };
}

// ─── Token list for frontend ───────────────────────────────
function getTokensForChain(chain) {
  return Object.entries(TOKENS[chain] || TOKENS.bsc).map(([sym, info]) => ({
    symbol: sym,
    address: info.address,
    decimals: info.decimals,
  }));
}

module.exports = { x402ForModel, getTokensForChain, TOKENS, PAYMENT_ADDRESS };
