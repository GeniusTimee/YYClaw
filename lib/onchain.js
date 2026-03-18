const { ethers } = require('ethers');

const ERC20_ABI = [
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// Chain configs
const CHAINS = {
  bsc: {
    rpc: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    tokens: {
      USD1: { address: '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d', decimals: 18 },
      USDT: { address: '0x55d398326f99059ff775485246999027b3197955', decimals: 18 },
      USDC: { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18 },
      U:    { address: '0xcE24439F2D9C6a2289F741120FE202248B666666', decimals: 18 },
    },
  },
  base: {
    rpc: 'https://mainnet.base.org',
    chainId: 8453,
    tokens: {
      USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
      USDT: { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6 },
    },
  },
};

// Lazy-init wallets per chain
const wallets = {};
function getWallet(chain) {
  if (wallets[chain]) return wallets[chain];
  const cfg = CHAINS[chain];
  if (!cfg) throw new Error(`Unknown chain: ${chain}`);
  const provider = new ethers.JsonRpcProvider(cfg.rpc, cfg.chainId);
  const pk = process.env.SPENDER_PRIVATE_KEY;
  if (!pk) throw new Error('SPENDER_PRIVATE_KEY not set');
  wallets[chain] = new ethers.Wallet(pk, provider);
  return wallets[chain];
}

/**
 * Transfer tokens from user to spender (our wallet) via transferFrom.
 * @param {string} chain - 'bsc' or 'base'
 * @param {string} tokenSymbol - 'USD1', 'USDT', 'USDC', 'U'
 * @param {string} fromAddress - user wallet address
 * @param {number} amountUsd - amount in USD (e.g. 0.02)
 * @returns {{ success: boolean, txHash?: string, error?: string }}
 */
async function chargeUser(chain, tokenSymbol, fromAddress, amountUsd) {
  try {
    const cfg = CHAINS[chain];
    if (!cfg) return { success: false, error: `Unknown chain: ${chain}` };

    const tokenCfg = cfg.tokens[tokenSymbol];
    if (!tokenCfg) return { success: false, error: `Token ${tokenSymbol} not available on ${chain}` };

    const wallet = getWallet(chain);
    const contract = new ethers.Contract(tokenCfg.address, ERC20_ABI, wallet);

    // Convert USD amount to token units (all stablecoins = $1)
    const amount = ethers.parseUnits(amountUsd.toFixed(tokenCfg.decimals > 6 ? 8 : 6), tokenCfg.decimals);

    // Check allowance first
    const allowance = await contract.allowance(fromAddress, wallet.address);
    if (allowance < amount) {
      return { success: false, error: 'Insufficient allowance' };
    }

    // Check user balance
    const balance = await contract.balanceOf(fromAddress);
    if (balance < amount) {
      return { success: false, error: 'Insufficient token balance' };
    }

    // Execute transferFrom
    const tx = await contract.transferFrom(fromAddress, wallet.address, amount);
    const receipt = await tx.wait();

    return { success: true, txHash: receipt.hash };
  } catch (e) {
    return { success: false, error: e.message || 'Transfer failed' };
  }
}

/**
 * Get total allowance across all tokens on a chain for a user.
 */
async function getAllowance(chain, fromAddress) {
  const cfg = CHAINS[chain];
  if (!cfg) return 0;
  const wallet = getWallet(chain);
  let total = 0;
  for (const [symbol, tokenCfg] of Object.entries(cfg.tokens)) {
    try {
      const contract = new ethers.Contract(tokenCfg.address, ERC20_ABI, wallet);
      const allowance = await contract.allowance(fromAddress, wallet.address);
      total += parseFloat(ethers.formatUnits(allowance, tokenCfg.decimals));
    } catch {}
  }
  return total;
}

/**
 * Find the best token to charge (highest allowance first).
 */
async function findBestToken(chain, fromAddress, amountUsd) {
  const cfg = CHAINS[chain];
  if (!cfg) return null;
  const wallet = getWallet(chain);

  for (const [symbol, tokenCfg] of Object.entries(cfg.tokens)) {
    try {
      const contract = new ethers.Contract(tokenCfg.address, ERC20_ABI, wallet);
      const amount = ethers.parseUnits(amountUsd.toFixed(tokenCfg.decimals > 6 ? 8 : 6), tokenCfg.decimals);
      const allowance = await contract.allowance(fromAddress, wallet.address);
      if (allowance >= amount) {
        const balance = await contract.balanceOf(fromAddress);
        if (balance >= amount) {
          return { chain, symbol, tokenCfg };
        }
      }
    } catch {}
  }
  return null;
}

/**
 * Auto-charge: try BSC first, then Base, find best token.
 */
async function autoCharge(fromAddress, amountUsd) {
  for (const chain of ['bsc', 'base']) {
    const best = await findBestToken(chain, fromAddress, amountUsd);
    if (best) {
      return chargeUser(chain, best.symbol, fromAddress, amountUsd);
    }
  }
  return { success: false, error: 'No token with sufficient allowance and balance found on any chain' };
}

module.exports = { chargeUser, getAllowance, findBestToken, autoCharge, CHAINS };
