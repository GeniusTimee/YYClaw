// ─── Token Registry ────────────────────────────────────────
export const SPENDER_ADDRESS = '0xfc625b2afee95dccc219a91d8bf391398cbeec35'

export const CHAINS = {
  bsc: {
    id: 56, name: 'BSC', symbol: 'BNB',
    rpc: 'https://bsc-dataseed.binance.org/',
    icon: '/icons/bnb.png',
  },
  base: {
    id: 8453, name: 'Base', symbol: 'ETH',
    rpc: 'https://mainnet.base.org',
    icon: '/icons/base.jpg',
  },
}

export const TOKENS = {
  bsc: [
    { symbol: 'USD1', address: '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d', decimals: 18, icon: '/icons/usd1.png' },
    { symbol: 'USDT', address: '0x55d398326f99059ff775485246999027b3197955', decimals: 18, icon: '/icons/usdt.png' },
    { symbol: 'USDC', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18, icon: '/icons/usdc.png' },
    { symbol: 'U', address: '0xcE24439F2D9C6a2289F741120FE202248B666666', decimals: 18, icon: '/icons/u.png' },
  ],
  base: [
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, icon: '/icons/usdc.png' },
    { symbol: 'USDT', address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6, icon: '/icons/usdt.png' },
  ],
}

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
]
