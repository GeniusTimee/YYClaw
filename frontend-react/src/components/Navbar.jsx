import { useState, useCallback } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import WalletModal from './WalletModal'

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(11,14,17,0.85)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #2B3139',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: 64,
  },
  logo: {
    fontSize: 22, fontWeight: 800, color: '#F0B90B', letterSpacing: '-0.5px',
    cursor: 'pointer', textDecoration: 'none',
  },
  links: { display: 'flex', gap: 32, alignItems: 'center' },
  link: {
    color: '#848E9C', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    textDecoration: 'none', transition: 'color 0.2s',
  },
  btn: {
    background: '#F0B90B', color: '#0B0E11', border: 'none',
    borderRadius: 8, padding: '8px 20px', fontWeight: 700,
    fontSize: 14, cursor: 'pointer', transition: 'opacity 0.2s',
  },
  addrBtn: {
    background: '#181A20', color: '#F0B90B', border: '1px solid #F0B90B',
    borderRadius: 8, padding: '8px 16px', fontWeight: 600,
    fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#0ECB81' },
  langBtn: {
    background: 'transparent', border: '1px solid #2B3139', borderRadius: 6,
    padding: '5px 12px', color: '#848E9C', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
  },
}

export default function Navbar() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, toggleLang, t } = useLang()
  const [showModal, setShowModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  return (
    <>
      <nav style={styles.nav}>
        <span style={styles.logo} onClick={() => navigate('/')}>
          <img src="/icons/yyclaw-logo.png" alt="YYClaw" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 10, verticalAlign: 'middle' }} />
          <span style={{ background: 'linear-gradient(135deg, #FFF8E1, #F0B90B, #E8A800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 2px 8px rgba(240,185,11,0.15))' }}>YY</span>
          <span style={{ color: '#EAECEF' }}>Claw</span>
        </span>
        <div style={styles.links}>
          {location.pathname !== '/' && (
            <span style={styles.link} onClick={() => navigate('/')}>{t('home')}</span>
          )}
          <span style={styles.link} onClick={() => navigate('/dashboard')}>{t('dashboard')}</span>
          <span style={styles.link} onClick={() => {
            if (location.pathname === '/dashboard') {
              window.dispatchEvent(new CustomEvent('yyclaw-tab', { detail: 'docs' }))
            } else {
              document.getElementById('docs')?.scrollIntoView({ behavior: 'smooth' })
            }
          }}>{t('docs')}</span>
          <span style={styles.link} onClick={() => {
            if (location.pathname === '/dashboard') {
              navigate('/')
              setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100)
            } else {
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
            }
          }}>{t('pricing')}</span>

          {/* Language toggle */}
          <button style={styles.langBtn} onClick={toggleLang}>
            {lang === 'en' ? '中文' : 'EN'}
          </button>

          {isConnected ? (
            <div style={{ position: 'relative' }}>
              <button style={styles.addrBtn} onClick={() => setShowMenu(v => !v)}>
                <span style={styles.dot} />
                {short}
              </button>
              {showMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: 44,
                  background: '#181A20', border: '1px solid #2B3139',
                  borderRadius: 8, padding: '8px 0', minWidth: 160, zIndex: 200,
                }}>
                  <div style={{ padding: '8px 16px', fontSize: 13, color: '#848E9C' }}>{short}</div>
                  <hr style={{ border: 'none', borderTop: '1px solid #2B3139' }} />
                  <div
                    style={{ padding: '10px 16px', fontSize: 14, color: '#EAECEF', cursor: 'pointer' }}
                    onClick={() => { navigate('/dashboard'); setShowMenu(false) }}
                  >{t('dashboard')}</div>
                  <div
                    style={{ padding: '10px 16px', fontSize: 14, color: '#F6465D', cursor: 'pointer' }}
                    onClick={() => { disconnect(); setShowMenu(false) }}
                  >{t('disconnect')}</div>
                </div>
              )}
            </div>
          ) : (
            <button style={styles.btn} onClick={() => setShowModal(true)}>{t('connectWallet')}</button>
          )}
        </div>
      </nav>
      {showModal && <WalletModal onClose={() => setShowModal(false)} />}
    </>
  )
}
