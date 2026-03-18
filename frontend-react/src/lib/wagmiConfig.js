import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { metaMask, walletConnect, injected } from 'wagmi/connectors'

const bsc = {
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://bsc-dataseed.binance.org/'] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' },
  },
}

const base = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
}

export const wagmiConfig = createConfig({
  chains: [bsc, base, mainnet],
  connectors: [
    injected({ target: 'metaMask' }),
    injected(),
    walletConnect({ projectId: 'YOUR_WC_PROJECT_ID' }),
  ],
  transports: {
    [bsc.id]: http('https://bsc-dataseed1.ninicoin.io/'),
    [base.id]: http('https://mainnet.base.org'),
    [mainnet.id]: http(),
  },
})
