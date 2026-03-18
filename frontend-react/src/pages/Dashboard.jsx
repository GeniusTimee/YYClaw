import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ApprovePanel from '../components/ApprovePanel'
import PriceTable from '../components/PriceTable'
import CodeDocs from '../components/CodeDocs'
import CallLogs from '../components/CallLogs'
import WalletModal from '../components/WalletModal'
import { useAuth } from '../hooks/useAuth'
import { useWalletBalances } from '../hooks/useWalletBalances'
import { useAllowances } from '../hooks/useAllowances'
import { useLang } from '../context/LanguageContext'

const card = {
  background: '#181A20', border: '1px solid #2B3139', borderRadius: 12, padding: 24,
}

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const { token, login, logout, loading, error, authFetch, isLoggedIn } = useAuth()
  const { balances, totalUsd, isLoading: balLoading } = useWalletBalances()
  const { allowances, totalAllowance, isLoading: allowLoading } = useAllowances()
  const [me, setMe] = useState(null)
  const [stats, setStats] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('overview')
  const { t } = useLang()

  useEffect(() => {
    if (!isConnected) { setShowModal(true) }
  }, [isConnected])

  // Listen for navbar tab switch events
  useEffect(() => {
    const handler = (e) => { if (tabs.includes(e.detail)) setTab(e.detail) }
    window.addEventListener('yyclaw-tab', handler)
    return () => window.removeEventListener('yyclaw-tab', handler)
  }, [])

  useEffect(() => {
    if (isLoggedIn && authFetch) {
      authFetch('/api/auth/me').then(r => r.json()).then(setMe).catch(() => {})
      authFetch('/api/billing/stats').then(r => r.json()).then(setStats).catch(() => {})
    }
  }, [isLoggedIn, authFetch])

  const totalSpent = stats?.total_spent || 0
  const remaining = Math.max(totalAllowance - totalSpent, 0)

  const tabs = ['overview', 'logs', 'docs']

  return (
    <div style={{ background: '#0B0E11', minHeight: '100vh', color: '#EAECEF' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 24px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{t('dashboardTitle')}</h1>
          <p style={{ color: '#848E9C', fontSize: 14 }}>
            {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : t('notConnected')}
          </p>
        </div>

        {/* Not connected */}
        {!isConnected && (
          <div style={{ ...card, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{t('connectWalletTitle')}</h2>
            <p style={{ color: '#848E9C', marginBottom: 28 }}>{t('connectWalletDesc')}</p>
            <button
              onClick={() => setShowModal(true)}
              style={{ background: '#F0B90B', color: '#0B0E11', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >{t('connectWallet')}</button>
          </div>
        )}

        {/* Connected but not logged in */}
        {isConnected && !isLoggedIn && (
          <div style={{ ...card, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{t('signIn')}</h2>
            <p style={{ color: '#848E9C', marginBottom: 28 }}>{t('signInDesc')}</p>
            {error && <p style={{ color: '#F6465D', marginBottom: 16, fontSize: 14 }}>{error}</p>}
            <button
              onClick={login}
              disabled={loading}
              style={{ background: '#F0B90B', color: '#0B0E11', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >{loading ? t('signingIn') : t('signInWithWallet')}</button>
          </div>
        )}

        {/* Logged in */}
        {isConnected && isLoggedIn && (
          <>
            {/* API Key */}
            <div style={{ ...card, marginBottom: 28, background: 'linear-gradient(135deg, #181A20, #1E2329)', border: '1px solid rgba(240,185,11,0.15)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 160, height: 160, background: 'radial-gradient(circle, rgba(240,185,11,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: '#848E9C', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{t('yourApiKey')}</div>
                <div style={{ fontSize: 11, color: '#5E6673' }}>
                  {t('baseUrl')}: <span style={{ color: '#848E9C', fontFamily: "'JetBrains Mono', monospace" }}>https://crypto.yyclaw.cc/v1</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <div style={{
                  flex: 1, background: '#0B0E11', border: '1px solid #2B3139', borderRadius: 8,
                  padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                  color: '#F0B90B', wordBreak: 'break-all', letterSpacing: 0.3,
                  display: 'flex', alignItems: 'center', lineHeight: 1.5,
                }}>
                  {me?.api_key || '—'}
                </div>
                {me?.api_key && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(me.api_key)
                      const el = document.getElementById('copy-feedback')
                      if (el) { el.textContent = t('copied'); setTimeout(() => el.textContent = t('copy'), 1200) }
                    }}
                    style={{
                      background: '#F0B90B', color: '#0B0E11', border: 'none', borderRadius: 8,
                      padding: '0 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  ><span id="copy-feedback">{t('copy')}</span></button>
                )}
                <button
                  onClick={() => setTab('docs')}
                  style={{
                    background: 'transparent', color: '#F0B90B', border: '1px solid rgba(240,185,11,0.4)',
                    borderRadius: 8, padding: '0 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >{t('quickStart')}</button>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
              <div style={card}>
                <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 6 }}>{t('authorized')}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#F0B90B' }}>
                  {allowLoading ? '...' : `$${totalAllowance.toFixed(2)}`}
                </div>
                {!allowLoading && allowances.filter(a => a.allowance > 0.001).length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {allowances.filter(a => a.allowance > 0.001).map(a => (
                      <div key={`${a.chain}-${a.symbol}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                        <span style={{ color: '#848E9C', display: 'flex', alignItems: 'center', gap: 4 }}><img src={a.icon} alt="" style={{ width: 14, height: 14, borderRadius: '50%' }} /> {a.symbol} <span style={{ color: '#5E6673', fontSize: 9 }}>({a.chain.toUpperCase()})</span></span>
                        <span style={{ color: '#EAECEF', fontFamily: 'monospace' }}>{a.allowance.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={card}>
                <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 6 }}>{t('spent')}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#F6465D' }}>${totalSpent.toFixed(4)}</div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#5E6673' }}>{stats?.total_calls || 0} {t('calls')}</div>
              </div>

              <div style={card}>
                <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 6 }}>{t('remaining')}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0ECB81' }}>
                  {allowLoading ? '...' : `$${remaining.toFixed(2)}`}
                </div>
                {totalAllowance > 0 && (
                  <div style={{ marginTop: 8, height: 4, background: '#2B3139', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${Math.min((remaining / totalAllowance) * 100, 100)}%`,
                      background: remaining / totalAllowance > 0.2 ? '#0ECB81' : '#F6465D',
                    }} />
                  </div>
                )}
              </div>

              <div style={card}>
                <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 6 }}>{t('walletBalance')}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#EAECEF' }}>
                  {balLoading ? '...' : `$${totalUsd.toFixed(2)}`}
                </div>
                {!balLoading && balances.filter(b => b.balance > 0.001).length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {balances.filter(b => b.balance > 0.001).map(b => (
                      <div key={`${b.chain}-${b.symbol}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                        <span style={{ color: '#848E9C', display: 'flex', alignItems: 'center', gap: 4 }}><img src={b.icon} alt="" style={{ width: 14, height: 14, borderRadius: '50%' }} /> {b.symbol} <span style={{ color: '#5E6673', fontSize: 9 }}>({b.chain.toUpperCase()})</span></span>
                        <span style={{ color: '#EAECEF', fontFamily: 'monospace' }}>{b.balance.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #2B3139' }}>
              {tabs.map(tb => (
                <button
                  key={tb}
                  onClick={() => setTab(tb)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '10px 20px', fontSize: 14, fontWeight: 600,
                    color: tab === tb ? '#F0B90B' : '#848E9C',
                    borderBottom: tab === tb ? '2px solid #F0B90B' : '2px solid transparent',
                  }}
                >{t(tb)}</button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                <ApprovePanel />
                <PriceTable />
              </div>
            )}

            {tab === 'logs' && <CallLogs authFetch={authFetch} />}

            {tab === 'docs' && <CodeDocs apiKey={me?.api_key} />}
          </>
        )}
      </div>

      {showModal && <WalletModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
