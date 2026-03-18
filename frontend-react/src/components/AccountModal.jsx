import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { CHAINS, TOKENS } from '../config'
import './Modal.css'

export default function AccountModal({ onClose }) {
  const { address, apiKey, chain, payToken, balances, allowances, loadingBal,
          switchChain, selectPayToken, approve, revoke, disconnect } = useWallet()
  const [approving, setApproving] = useState('')
  const [approveAmt, setApproveAmt] = useState('100')
  const [txHash, setTxHash] = useState('')
  const [err, setErr] = useState('')

  const tokens = TOKENS[chain] || {}

  const handleApprove = async (sym) => {
    setApproving(sym); setErr(''); setTxHash('')
    try {
      const hash = await approve(sym, approveAmt)
      setTxHash(hash)
    } catch(e) { setErr(e.message) }
    finally { setApproving('') }
  }

  const handleRevoke = async (sym) => {
    setApproving('revoke-'+sym); setErr(''); setTxHash('')
    try {
      const hash = await revoke(sym)
      setTxHash(hash)
    } catch(e) { setErr(e.message) }
    finally { setApproving('') }
  }

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey)
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal modal-account" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Account</h2>

        {/* Wallet */}
        <div className="acct-row">
          <span className="acct-label">Wallet</span>
          <span className="acct-val mono">{address.slice(0,8)}...{address.slice(-6)}</span>
        </div>

        {/* Chain switcher */}
        <div className="acct-row">
          <span className="acct-label">Chain</span>
          <div className="chain-btns-sm">
            {Object.entries(CHAINS).map(([key, c]) => (
              <button key={key} className={`chain-btn-sm ${chain===key?'active':''}`}
                onClick={() => switchChain(key)}>{c.name}</button>
            ))}
          </div>
        </div>

        {/* Token balances */}
        <div className="acct-section">
          <div className="acct-section-title">
            Token Balances
            {loadingBal && <span className="loading-dot"> ···</span>}
          </div>
          {Object.entries(tokens).map(([sym, info]) => {
            const bal = parseFloat(balances[sym] || 0)
            const allow = parseFloat(allowances[sym] || 0)
            return (
              <div key={sym} className={`token-row ${payToken===sym?'selected':''}`}
                onClick={() => selectPayToken(sym)}>
                <span className="token-icon">{info.icon}</span>
                <span className="token-sym">{sym}</span>
                <span className="token-bal" style={{color: bal>0?'var(--green)':'var(--text3)'}}>
                  {bal.toFixed(4)}
                </span>
                <span className="token-allow" title="Approved amount">
                  {allow > 0 ? `✓ ${allow.toFixed(2)} approved` : ''}
                </span>
              </div>
            )
          })}
        </div>

        {/* Authorize */}
        <div className="acct-section">
          <div className="acct-section-title">Authorize Payment ({payToken})</div>
          <div className="approve-row">
            <input
              className="approve-input"
              type="number" min="1" value={approveAmt}
              onChange={e => setApproveAmt(e.target.value)}
              placeholder="Amount"
            />
            <span className="approve-unit">{payToken}</span>
            <button className="btn-approve"
              onClick={() => handleApprove(payToken)}
              disabled={!!approving}>
              {approving===payToken ? 'Approving...' : 'Authorize'}
            </button>
            {parseFloat(allowances[payToken]||0) > 0 && (
              <button className="btn-revoke"
                onClick={() => handleRevoke(payToken)}
                disabled={!!approving}>
                {approving==='revoke-'+payToken ? '...' : 'Revoke'}
              </button>
            )}
          </div>
          <p className="x402-hint">
            ⚡ x402 auto-pay: each API call deducts {payToken} from your wallet. No pre-deposit needed.
          </p>
          {txHash && <p className="tx-hash">✓ Tx: {txHash.slice(0,18)}...</p>}
          {err && <p className="error-msg">{err}</p>}
        </div>

        {/* API Key */}
        <div className="acct-row">
          <span className="acct-label">API Key</span>
          <span className="acct-val mono" style={{fontSize:'11px'}}>{apiKey?.slice(0,20)}...</span>
          <button className="copy-btn" onClick={copyKey}>copy</button>
        </div>

        <div className="acct-actions">
          <button className="btn-primary" onClick={() => location.href='dashboard.html'}>
            Open Dashboard →
          </button>
          <button className="btn-ghost" onClick={() => { disconnect(); onClose() }}>
            Disconnect
          </button>
        </div>
      </div>
    </div>
  )
}
