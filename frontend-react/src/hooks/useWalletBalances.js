import { useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { ERC20_ABI, TOKENS, CHAINS } from '../lib/contracts'

/**
 * Reads all token balances across all chains for the connected wallet.
 * Returns { balances: [{ chain, chainId, symbol, balance, icon }], totalUsd }
 * (All tokens are stablecoins pegged to $1, so totalUsd = sum of all balances)
 */
export function useWalletBalances() {
  const { address } = useAccount()

  // Build all read calls
  const calls = []
  const meta = []
  for (const [chainKey, tokens] of Object.entries(TOKENS)) {
    const chainId = CHAINS[chainKey]?.id
    if (!chainId) continue
    for (const token of tokens) {
      calls.push({
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
        chainId,
      })
      meta.push({ chain: chainKey, chainId, symbol: token.symbol, decimals: token.decimals, icon: token.icon })
    }
  }

  const { data, isLoading, refetch } = useReadContracts({
    contracts: calls,
    query: { enabled: !!address, refetchInterval: 15000 },
  })

  const balances = meta.map((m, i) => {
    const result = data?.[i]
    const raw = result?.status === 'success' ? result.result : 0n
    const bal = parseFloat(formatUnits(raw, m.decimals))
    return { ...m, balance: bal }
  })

  const totalUsd = balances.reduce((sum, b) => sum + b.balance, 0)

  return { balances, totalUsd, isLoading, refetch }
}
