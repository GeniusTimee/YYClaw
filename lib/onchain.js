const { ethers } = require('ethers');

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const SPENDER_ABI = [
  'function collectPayment(address from, address token, uint256 amount, bytes32 callId) returns (bool)',
  'function checkPayable(address from, address token, uint256 amount) view returns (bool hasAllowance, bool hasBalance, uint256 allowanceAmt, uint256 balanceAmt)',
];

// Spender contract addresses
const SPENDER_CONTRACTS = {
  bsc:  '0x530eF6EaaB683d099F6653e943806f3aA603d173',
  base: '0x0425fE170491b2A9385681040Dd7848fade90b4B',
};

// Chain configs
const CHAINS = {
  bsc: {
    rpc: 'https://bsc-dataseed1.ninicoin.io/',
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
 * Charge user via SpenderContract.collectPayment
 */
async function chargeUser(chain, tokenSymbol, fromAddress, amountUsd) {
  try {
    const cfg = CHAINS[chain];
    if (!cfg) return { success: false, error: `Unknown chain: ${chain}` };
    const tokenCfg = cfg.tokens[tokenSymbol];
    if (!tokenCfg) return { success: false, error: `Token ${tokenSymbol} not on ${chain}` };
    const spenderAddr = SPENDER_CONTRACTS[chain];
    if (!spenderAddr) return { success: false, error: `No spender contract on ${chain}` };

    const wallet = getWallet(chain);
    const spender = new ethers.Contract(spenderAddr, SPENDER_ABI, wallet);
    const amount = ethers.parseUnits(amountUsd.toFixed(tokenCfg.decimals > 6 ? 8 : 6), tokenCfg.decimals);

    // Generate unique callId
    const callId = ethers.id(`${fromAddress}-${Date.now()}-${Math.random()}`);

    const tx = await spender.collectPayment(fromAddress, tokenCfg.address, amount, callId);
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash };
  } catch (e) {
    return { success: false, error: e.message || 'collectPayment failed' };
  }
}

/**
 * Get total allowance across all tokens on a chain (allowance to spender contract).
 */
async function getAllowance(chain, fromAddress) {
  const cfg = CHAINS[chain];
  if (!cfg) return 0;
  const spenderAddr = SPENDER_CONTRACTS[chain];
  if (!spenderAddr) return 0;
  const provider = new ethers.JsonRpcProvider(cfg.rpc, cfg.chainId);
  let total = 0;
  for (const [symbol, tokenCfg] of Object.entries(cfg.tokens)) {
    try {
      const contract = new ethers.Contract(tokenCfg.address, ERC20_ABI, provider);
      const allowance = await contract.allowance(fromAddress, spenderAddr);
      total += parseFloat(ethers.formatUnits(allowance, tokenCfg.decimals));
    } catch {}
  }
  return total;
}

/**
 * Find the best token to charge on a given chain.
 */
async function findBestToken(chain, fromAddress, amountUsd) {
  const cfg = CHAINS[chain];
  if (!cfg) return null;
  const spenderAddr = SPENDER_CONTRACTS[chain];
  if (!spenderAddr) return null;
  const provider = new ethers.JsonRpcProvider(cfg.rpc, cfg.chainId);

  for (const [symbol, tokenCfg] of Object.entries(cfg.tokens)) {
    try {
      const contract = new ethers.Contract(tokenCfg.address, ERC20_ABI, provider);
      const amount = ethers.parseUnits(amountUsd.toFixed(tokenCfg.decimals > 6 ? 8 : 6), tokenCfg.decimals);
      const allowance = await contract.allowance(fromAddress, spenderAddr);
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
 * Auto-charge: try BSC first, then Base.
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

module.exports = { chargeUser, getAllowance, findBestToken, autoCharge, CHAINS, SPENDER_CONTRACTS };
