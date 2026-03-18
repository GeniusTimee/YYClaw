import { useConnect } from 'wagmi'
import { useLang } from '../context/LanguageContext'

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}
const modal = {
  background: '#181A20', border: '1px solid #2B3139', borderRadius: 16,
  padding: 32, minWidth: 360, maxWidth: '90vw',
}

const WALLET_ICONS = {
  metamask: '/icons/metamask.svg',
  okx: '/icons/okx.jpg',
  binance: '/icons/binance-wallet.png',
}

function getWalletIcon(name) {
  const n = name.toLowerCase()
  if (n.includes('binance')) return WALLET_ICONS.binance
  if (n.includes('metamask')) return WALLET_ICONS.metamask
  if (n.includes('okx')) return WALLET_ICONS.okx
  return null
}

function isBinance(name) {
  return name.toLowerCase().includes('binance')
}

function sortConnectors(connectors) {
  return [...connectors].sort((a, b) => {
    const aIsBinance = isBinance(a.name)
    const bIsBinance = isBinance(b.name)
    if (aIsBinance && !bIsBinance) return -1
    if (!aIsBinance && bIsBinance) return 1
    return 0
  })
}

export default function WalletModal({ onClose }) {
  const { connect, connectors, isPending } = useConnect()
  const { t } = useLang()

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#EAECEF' }}>{t('connectWallet')}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#848E9C', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortConnectors(connectors).map(connector => {
            const icon = getWalletIcon(connector.name) || connector.icon
            const recommended = isBinance(connector.name)
            return (
              <button
                key={connector.uid}
                onClick={() => { connect({ connector }); onClose() }}
                disabled={isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: recommended ? 'rgba(240,185,11,0.08)' : '#0B0E11',
                  border: recommended ? '1.5px solid #F0B90B' : '1px solid #2B3139',
                  borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
                  color: '#EAECEF', fontSize: 15, fontWeight: 500,
                  transition: 'border-color 0.2s, background 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#F0B90B'; e.currentTarget.style.background = 'rgba(240,185,11,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = recommended ? '#F0B90B' : '#2B3139'; e.currentTarget.style.background = recommended ? 'rgba(240,185,11,0.08)' : '#0B0E11' }}
              >
                {icon ? (
                  <img src={icon} alt={connector.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 24, width: 28, textAlign: 'center' }}>🔗</span>
                )}
                <span style={{ flex: 1 }}>{connector.name}</span>
                {recommended && (
                  <span style={{
                    background: '#F0B90B', color: '#0B0E11', fontSize: 10, fontWeight: 700,
                    padding: '3px 8px', borderRadius: 4, letterSpacing: 0.5,
                  }}>
                    ⭐ {t('recommended') || 'Recommended'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: '#848E9C', textAlign: 'center' }}>
          {t('walletTerms') || 'By connecting, you agree to our Terms of Service'}
        </p>
      </div>
    </div>
  )
}
