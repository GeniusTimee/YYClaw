import { useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { ERC20_ABI, SPENDER_ADDRESS } from '../lib/contracts'

/**
 * @param {object} token - { symbol, address, decimals }
 * @param {number} chainId
 */
export function useAllowance(token, chainId) {
  const { address } = useAccount()

  const enabled = !!address && !!token?.address && !!chainId

  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: token?.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, SPENDER_ADDRESS],
    chainId,
    query: { enabled, refetchInterval: 10000 },
  })

  const { data: balanceRaw, refetch: refetchBalance } = useReadContract({
    address: token?.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    chainId,
    query: { enabled, refetchInterval: 10000 },
  })

  const { writeContract, data: txHash, isPending, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isSuccess) {
      refetchAllowance()
      refetchBalance()
    }
  }, [isSuccess, refetchAllowance, refetchBalance])

  const approve = (amount) => {
    if (!token) return
    reset()
    writeContract({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [SPENDER_ADDRESS, parseUnits(String(amount), token.decimals)],
      chainId,
    })
  }

  const revoke = () => {
    if (!token) return
    reset()
    writeContract({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [SPENDER_ADDRESS, 0n],
      chainId,
    })
  }

  const decimals = token?.decimals || 18

  return {
    allowance: allowanceRaw != null ? formatUnits(allowanceRaw, decimals) : '0',
    balance: balanceRaw != null ? formatUnits(balanceRaw, decimals) : '0',
    approve,
    revoke,
    isPending: isPending || isConfirming,
    isSuccess,
    refetch: () => { refetchAllowance(); refetchBalance() },
  }
}
