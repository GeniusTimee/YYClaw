import { useState, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

const TOKEN_KEY = 'yyclaw_token'

export function useAuth() {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback(async () => {
    if (!address) return
    setLoading(true)
    setError(null)
    try {
      const nonceRes = await fetch(`/api/auth/nonce?address=${address}`)
      const { nonce } = await nonceRes.json()
      const message = `YYClaw Login\nAddress: ${address}\nNonce: ${nonce}`
      const signature = await signMessageAsync({ message })
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, chain: 'bsc' }),
      })
      const data = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(data.error || 'Verify failed')
      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      return data
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [address, signMessageAsync])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  const authFetch = useCallback(async (url, opts = {}) => {
    const t = localStorage.getItem(TOKEN_KEY)
    const res = await fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${t}`,
      },
    })
    if (res.status === 401) {
      logout()
      throw new Error('Unauthorized')
    }
    return res
  }, [logout])

  return { token, login, logout, loading, error, authFetch, isLoggedIn: !!token }
}
