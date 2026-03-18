import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import Navbar from '../components/Navbar'
import PriceTable from '../components/PriceTable'
import CodeDocs from '../components/CodeDocs'
import WalletModal from '../components/WalletModal'
import { useLang } from '../context/LanguageContext'

// Particle canvas background
function ParticleCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    const particles = []
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2,
      })
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240,185,11,${p.alpha})`
        ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(240,185,11,${0.08 * (1 - dist / 120)})`
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function RevealSection({ children, style }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} style={{
      transition: 'opacity 0.7s, transform 0.7s',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(40px)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { isConnected } = useAccount()
  const [showModal, setShowModal] = useState(false)
  const { t } = useLang()

  const features = [
    { icon: '⚡', title: t('featLowLatency'), desc: t('featLowLatencyDesc') },
    { icon: '🔒', title: t('featSecure'), desc: t('featSecureDesc') },
    { icon: '💰', title: t('featPayGo'), desc: t('featPayGoDesc') },
    { icon: '🤖', title: t('featModels'), desc: t('featModelsDesc') },
    { icon: '📊', title: t('featAnalytics'), desc: t('featAnalyticsDesc') },
    { icon: '🔌', title: t('featCompat'), desc: t('featCompatDesc') },
  ]

  return (
    <div style={{ background: '#0B0E11', minHeight: '100vh', color: '#EAECEF' }}>
      <ParticleCanvas />
      <Navbar />

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px 40px' }}>
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: 'inline-block', background: 'rgba(240,185,11,0.1)', border: '1px solid rgba(240,185,11,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#F0B90B', marginBottom: 24 }}>
            {t('heroBadge')}
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
            {t('heroTitle1')}<br />
            <span style={{ background: 'linear-gradient(135deg, #FFF8E1, #F0B90B, #E8A800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 4px 15px rgba(240,185,11,0.15))' }}>{t('heroTitle2')}</span>
          </h1>
          <p style={{ fontSize: 18, color: '#848E9C', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            {t('heroDesc')}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => isConnected ? navigate('/dashboard') : setShowModal(true)}
              style={{ background: '#F0B90B', color: '#0B0E11', border: 'none', borderRadius: 10, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              {isConnected ? t('goToDashboard') : t('getStarted')}
            </button>
            <button
              onClick={() => document.getElementById('docs')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'transparent', color: '#EAECEF', border: '1px solid #2B3139', borderRadius: 10, padding: '14px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
            >
              {t('viewDocs')}
            </button>
          </div>
          <div style={{ marginTop: 60, display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['50+', t('statModels')], ['99.9%', t('statUptime')], ['<100ms', t('statLatency')], ['0', t('statKyc')]].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#F0B90B' }}>{v}</div>
                <div style={{ fontSize: 13, color: '#848E9C', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <RevealSection>
          <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>{t('whyYYClaw')}</h2>
          <p style={{ textAlign: 'center', color: '#848E9C', marginBottom: 56, fontSize: 16 }}>{t('whyDesc')}</p>
        </RevealSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <RevealSection key={f.title} style={{ transitionDelay: `${i * 80}ms` }}>
              <div style={{ background: '#181A20', border: '1px solid #2B3139', borderRadius: 12, padding: 28, height: '100%' }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: '#848E9C', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 800, margin: '0 auto' }}>
        <RevealSection>
          <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>{t('transparentPricing')}</h2>
          <p style={{ textAlign: 'center', color: '#848E9C', marginBottom: 40, fontSize: 16 }}>{t('pricingDesc')}</p>
          <PriceTable />
        </RevealSection>
      </section>

      {/* Docs */}
      <section id="docs" style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 800, margin: '0 auto' }}>
        <RevealSection>
          <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>{t('startIn60')}</h2>
          <p style={{ textAlign: 'center', color: '#848E9C', marginBottom: 40, fontSize: 16 }}>{t('startIn60Desc')}</p>
          <CodeDocs />
        </RevealSection>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', textAlign: 'center' }}>
        <RevealSection>
          <div style={{ background: 'linear-gradient(135deg, rgba(240,185,11,0.1), rgba(240,185,11,0.05))', border: '1px solid rgba(240,185,11,0.2)', borderRadius: 20, padding: '60px 40px', maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>{t('readyToBuild')}</h2>
            <p style={{ color: '#848E9C', marginBottom: 32, fontSize: 16 }}>{t('readyDesc')}</p>
            <button
              onClick={() => isConnected ? navigate('/dashboard') : setShowModal(true)}
              style={{ background: '#F0B90B', color: '#0B0E11', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              {isConnected ? t('openDashboard') : t('connectWallet')}
            </button>
          </div>
        </RevealSection>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid #2B3139', padding: '32px 24px', textAlign: 'center', color: '#848E9C', fontSize: 13 }}>
        {t('footer')}
      </footer>

      {showModal && <WalletModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
