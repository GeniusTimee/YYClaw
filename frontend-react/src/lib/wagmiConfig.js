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

// Binance Web3 Wallet connector — detects window.BinanceChain or Binance injected provider
const binanceWallet = injected({
  target: {
    id: 'binanceWallet',
    name: 'Binance Web3 Wallet',
    provider: () => {
      if (typeof window === 'undefined') return undefined
      // Binance Web3 Wallet injects as window.BinanceChain or via ethereum provider with isBinance
      if (window.BinanceChain) return window.BinanceChain
      if (window.ethereum?.isBinance) return window.ethereum
      // Binance app also injects via providers array
      if (window.ethereum?.providers) {
        const binance = window.ethereum.providers.find(p => p.isBinance)
        if (binance) return binance
      }
      return undefined
    },
  },
})

export const wagmiConfig = createConfig({
  chains: [bsc, base, mainnet],
  connectors: [
    binanceWallet,
    metaMask(),
    injected({
      target: 'okxWallet',
    }),
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
