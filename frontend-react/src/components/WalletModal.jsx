import { useConnect } from 'wagmi'

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}
const modal = {
  background: '#181A20', border: '1px solid #2B3139', borderRadius: 16,
  padding: 32, minWidth: 360, maxWidth: '90vw',
}

export default function WalletModal({ onClose }) {
  const { connect, connectors, isPending } = useConnect()

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#EAECEF' }}>Connect Wallet</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#848E9C', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {connectors.map(connector => (
            <button
              key={connector.uid}
              onClick={() => { connect({ connector }); onClose() }}
              disabled={isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: '#0B0E11', border: '1px solid #2B3139',
                borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
                color: '#EAECEF', fontSize: 15, fontWeight: 500,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#F0B90B'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2B3139'}
            >
              <span style={{ fontSize: 24 }}>
                {connector.name.toLowerCase().includes('metamask') ? '🦊' : '🔗'}
              </span>
              {connector.name}
            </button>
          ))}
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: '#848E9C', textAlign: 'center' }}>
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}
