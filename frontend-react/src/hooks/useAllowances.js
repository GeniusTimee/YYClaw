import { useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { ERC20_ABI, TOKENS, CHAINS, SPENDER_ADDRESSES } from '../lib/contracts'

/**
 * Reads allowance for all tokens across all chains.
 * Returns { allowances: [{ chain, chainId, symbol, allowance, icon }], totalAllowance }
 */
export function useAllowances() {
  const { address } = useAccount()

  const calls = []
  const meta = []
  for (const [chainKey, tokens] of Object.entries(TOKENS)) {
    const chainId = CHAINS[chainKey]?.id
    if (!chainId) continue
    const spender = SPENDER_ADDRESSES[chainKey]
    for (const token of tokens) {
      calls.push({
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, spender],
        chainId,
      })
      meta.push({ chain: chainKey, chainId, symbol: token.symbol, decimals: token.decimals, icon: token.icon })
    }
  }

  const { data, isLoading, refetch } = useReadContracts({
    contracts: calls,
    query: { enabled: !!address, refetchInterval: 30000 },
  })

  const allowances = meta.map((m, i) => {
    const result = data?.[i]
    const raw = result?.status === 'success' ? result.result : 0n
    const val = parseFloat(formatUnits(raw, m.decimals))
    return { ...m, allowance: val }
  })

  const totalAllowance = allowances.reduce((sum, a) => sum + a.allowance, 0)

  return { allowances, totalAllowance, isLoading, refetch }
}
