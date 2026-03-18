import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { CHAINS, TOKENS, PAYMENT_ADDRESS, ERC20_ABI, API_BASE } from '../config'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [address, setAddress]           = useState('')
  const [token, setToken]               = useState('')
  const [apiKey, setApiKey]             = useState('')
  const [chain, setChain]               = useState(localStorage.getItem('yyclaw_chain') || 'bsc')
  const [payToken, setPayToken]         = useState(localStorage.getItem('yyclaw_pay_token') || 'USD1')
  const [balances, setBalances]         = useState({})
  const [allowances, setAllowances]     = useState({})
  const [loadingBal, setLoadingBal]     = useState(false)

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('yyclaw_token')
    if (!saved) return
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: 'Bearer ' + saved } })
      .then(r => r.json())
      .then(u => {
        if (u.wallet_address) {
          setAddress(u.wallet_address)
          setToken(saved)
          setApiKey(u.api_key)
        }
      }).catch(() => {})
  }, [])

  // Load balances when address/chain changes
  useEffect(() => {
    if (address) loadBalances()
  }, [address, chain])

  const loadBalances = useCallback(async () => {
    if (!address) return
    setLoadingBal(true)
    const chainCfg = CHAINS[chain]
    const tokens = TOKENS[chain] || {}
    const provider = new ethers.JsonRpcProvider(chainCfg.rpc)
    const bals = {}, allows = {}
    for (const [sym, info] of Object.entries(tokens)) {
      try {
        const c = new ethers.Contract(info.address, ERC20_ABI, provider)
        const [bal, allow] = await Promise.all([
          c.balanceOf(address),
          c.allowance(address, PAYMENT_ADDRESS),
        ])
        bals[sym]   = ethers.formatUnits(bal, info.decimals)
        allows[sym] = ethers.formatUnits(allow, info.decimals)
      } catch { bals[sym] = '0'; allows[sym] = '0' }
    }
    setBalances(bals)
    setAllowances(allows)
    setLoadingBal(false)
  }, [address, chain])

  const switchChain = useCallback(async (newChain) => {
    const c = CHAINS[newChain]
    if (!c) return
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: c.hex }] })
      } catch {}
    }
    setChain(newChain)
    localStorage.setItem('yyclaw_chain', newChain)
    // reset default pay token per chain
    const firstToken = Object.keys(TOKENS[newChain] || {})[0]
    if (firstToken) { setPayToken(firstToken); localStorage.setItem('yyclaw_pay_token', firstToken) }
  }, [])

  const selectPayToken = useCallback((sym) => {
    setPayToken(sym)
    localStorage.setItem('yyclaw_pay_token', sym)
  }, [])

  const connect = useCallback(async (type) => {
    let provider
    if (type === 'binance' && window.BinanceChain) {
      provider = new ethers.BrowserProvider(window.BinanceChain)
    } else if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum)
    } else {
      throw new Error('No wallet found')
    }
    await provider.send('eth_requestAccounts', [])
    const c = CHAINS[chain]
    try { await provider.send('wallet_switchEthereumChain', [{ chainId: c.hex }]) } catch {}
    const signer = await provider.getSigner()
    const addr = await signer.getAddress()
    const nonceRes = await fetch(`${API_BASE}/api/auth/nonce`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: addr })
    }).then(r => r.json())
    const msg = `YYClaw Login\nAddress: ${addr}\nNonce: ${nonceRes.nonce}`
    const sig = await signer.signMessage(msg)
    const verifyRes = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: addr, signature: sig, chain })
    }).then(r => r.json())
    if (!verifyRes.token) throw new Error(verifyRes.error || 'Auth failed')
    setAddress(addr)
    setToken(verifyRes.token)
    setApiKey(verifyRes.apiKey)
    localStorage.setItem('yyclaw_token', verifyRes.token)
    localStorage.setItem('yyclaw_key', verifyRes.apiKey)
    return addr
  }, [chain])

  const disconnect = useCallback(() => {
    setAddress(''); setToken(''); setApiKey(''); setBalances({}); setAllowances({})
    localStorage.removeItem('yyclaw_token'); localStorage.removeItem('yyclaw_key')
  }, [])

  // Permit2 approve
  const approve = useCallback(async (sym, amount = '1000') => {
    const tokenInfo = TOKENS[chain]?.[sym]
    if (!tokenInfo || !window.ethereum) throw new Error('No token/wallet')
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, signer)
    const amountWei = ethers.parseUnits(amount, tokenInfo.decimals)
    const tx = await contract.approve(PAYMENT_ADDRESS, amountWei)
    await tx.wait()
    await loadBalances()
    return tx.hash
  }, [chain, loadBalances])

  const revoke = useCallback(async (sym) => {
    return approve(sym, '0')
  }, [approve])

  return (
    <WalletContext.Provider value={{
      address, token, apiKey, chain, payToken,
      balances, allowances, loadingBal,
      connect, disconnect, switchChain, selectPayToken,
      approve, revoke, loadBalances,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => useContext(WalletContext)
