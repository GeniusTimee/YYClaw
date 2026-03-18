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

// Binance Web3 Wallet — in Binance App, window.ethereum IS the Binance provider
const binanceWallet = injected({
  target: {
    id: 'binanceWeb3Wallet',
    name: 'Binance Web3 Wallet',
    provider: () => {
      if (typeof window === 'undefined') return undefined
      // Check for explicit Binance provider
      if (window.ethereum?.isBinance) return window.ethereum
      if (window.ethereum?.providers) {
        const bp = window.ethereum.providers.find(p => p.isBinance)
        if (bp) return bp
      }
      if (window.BinanceChain) return window.BinanceChain
      // In Binance App DApp browser, window.ethereum is the Binance provider
      // but may not have isBinance flag — fall back to it
      if (window.ethereum) return window.ethereum
      return undefined
    },
  },
})

export const wagmiConfig = createConfig({
  chains: [bsc, base, mainnet],
  multiInjectedProviderDiscovery: false,
  connectors: [
    binanceWallet,
    metaMask(),
    walletConnect({
      projectId: '4c5b02dbb1e24040e8e5e0e36a8e3cb1',
      metadata: {
        name: 'YYClaw',
        description: 'Web3-Native Pay-Per-Call AI Gateway',
        url: 'https://yyclaw.cc',
        icons: ['https://yyclaw.cc/icons/yyclaw-logo.png'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [bsc.id]: http('https://bsc-dataseed1.ninicoin.io/'),
    [base.id]: http('https://mainnet.base.org'),
    [mainnet.id]: http(),
  },
})
