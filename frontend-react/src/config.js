export const CHAINS = {
  bsc:  { id: 56,   hex: '0x38',   name: 'BSC',  rpc: 'https://bsc-dataseed.binance.org/', symbol: 'BNB' },
  base: { id: 8453, hex: '0x2105', name: 'Base', rpc: 'https://mainnet.base.org',          symbol: 'ETH' },
}

export const TOKENS = {
  bsc: {
    USD1: { address: '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d', decimals: 18, icon: '💵' },
    USDT: { address: '0x55d398326f99059ff775485246999027b3197955', decimals: 18, icon: '💲' },
    USDC: { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18, icon: '🔵' },
  },
  base: {
    USDC:  { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, icon: '🔵' },
    USDbC: { address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6, icon: '🔹' },
  },
}

export const PAYMENT_ADDRESS = '0xfc625b2afee95dccc219a91d8bf391398cbeec35'

export const MODELS = [
  ['claude-haiku-4.5-fixed',                      'Anthropic', 0.064, 'claude'],
  ['claude-haiku-4.5-thinking-fixed',              'Anthropic', 0.064, 'claude'],
  ['claude-opus-4-6-thinking-fixed',               'Anthropic', 0.160, 'claude'],
  ['claude-opus-4.6-fixed',                        'Anthropic', 0.160, 'claude'],
  ['claude-sonnet-4-6-fixed',                      'Anthropic', 0.100, 'claude'],
  ['claude-sonnet-4-fixed',                        'Anthropic', 0.100, 'claude'],
  ['claude-sonnet-4-thinking-fixed',               'Anthropic', 0.100, 'claude'],
  ['claude-sonnet-4.5-fixed',                      'Anthropic', 0.100, 'claude'],
  ['claude-sonnet-4.5-thinking-fixed',             'Anthropic', 0.100, 'claude'],
  ['gemini-2.5-flash-fixed',                       'Google',    0.010, 'gemini'],
  ['gemini-2.5-pro-fixed',                         'Google',    0.060, 'gemini'],
  ['gemini-3-flash-agent-fixed',                   'Google',    0.020, 'gemini'],
  ['gemini-3-flash-fixed',                         'Google',    0.020, 'gemini'],
  ['gemini-3-flash-preview-fixed',                 'Google',    0.030, 'gemini'],
  ['gemini-3-pro-preview-fixed',                   'Google',    0.080, 'gemini'],
  ['gemini-3-pro-preview-thinking-128-fixed',      'Google',    0.080, 'gemini'],
  ['gemini-3-pro-preview-thinking-512-fixed',      'Google',    0.080, 'gemini'],
  ['gemini-3-pro-preview-thinking-fixed',          'Google',    0.080, 'gemini'],
  ['gemini-3.1-flash-image-fixed',                 'Google',    0.200, 'gemini'],
  ['gemini-3.1-pro-high-fixed',                    'Google',    0.060, 'gemini'],
]

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]
