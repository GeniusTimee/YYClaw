import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import Navbar from '../components/Navbar'
import PriceTable from '../components/PriceTable'
import CodeDocs from '../components/CodeDocs'
import WalletModal from '../components/WalletModal'

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
      // draw lines between close particles
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

// Scroll reveal hook
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

const features = [
  { icon: '⚡', title: 'Ultra Low Latency', desc: 'Global edge nodes ensure sub-100ms response times for all API calls.' },
  { icon: '🔒', title: 'Secure by Design', desc: 'Web3 wallet auth — no passwords, no leaks. Your keys, your account.' },
  { icon: '💰', title: 'Pay As You Go', desc: 'Pre-authorize USD1 on-chain. Only pay for what you use, revoke anytime.' },
  { icon: '🤖', title: '50+ AI Models', desc: 'GPT-4o, Claude, Gemini, Llama and more — all through one unified API.' },
  { icon: '📊', title: 'Real-time Analytics', desc: 'Track usage, costs, and performance from your dashboard.' },
  { icon: '🔌', title: 'OpenAI Compatible', desc: 'Drop-in replacement. Change one line of code to switch.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { isConnected } = useAccount()
  const [showModal, setShowModal] = useState(false)

  return (
    <div style={{ background: '#0B0E11', minHeight: '100vh', color: '#EAECEF' }}>
      <ParticleCanvas />
      <Navbar />

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px 40px' }}>
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: 'inline-block', background: 'rgba(240,185,11,0.1)', border: '1px solid rgba(240,185,11,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#F0B90B', marginBottom: 24 }}>
            🚀 Web3-Native AI API Gateway
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
            The Fastest Way to<br />
            <span style={{ background: 'linear-gradient(135deg, #FFF8E1, #F0B90B, #E8A800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 4px 15px rgba(240,185,11,0.15))' }}>Access AI Models</span>
          </h1>
          <p style={{ fontSize: 18, color: '#848E9C', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Connect your wallet, authorize USD1, and start calling 50+ AI models instantly. No credit cards. No KYC. Just code.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => isConnected ? navigate('/dashboard') : setShowModal(true)}
              style={{ background: '#F0B90B', color: '#0B0E11', border: 'none', borderRadius: 10, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              {isConnected ? 'Go to Dashboard' : 'Get Started Free'}
            </button>
            <button
              onClick={() => document.getElementById('docs')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'transparent', color: '#EAECEF', border: '1px solid #2B3139', borderRadius: 10, padding: '14px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
            >
              View Docs
            </button>
          </div>
          <div style={{ marginTop: 60, display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['50+', 'AI Models'], ['99.9%', 'Uptime'], ['<100ms', 'Latency'], ['0', 'KYC Required']].map(([v, l]) => (
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
          <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Why YYClaw?</h2>
          <p style={{ textAlign: 'center', color: '#848E9C', marginBottom: 56, fontSize: 16 }}>Built for developers who move fast</p>
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
          <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Transparent Pricing</h2>
          <p style={{ textAlign: 'center', color: '#848E9C', marginBottom: 40, fontSize: 16 }}>Pay per call, no subscriptions</p>
          <PriceTable />
        </RevealSection>
      </section>

      {/* Docs */}
      <section id="docs" style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 800, margin: '0 auto' }}>
        <RevealSection>
          <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Start in 60 Seconds</h2>
          <p style={{ textAlign: 'center', color: '#848E9C', marginBottom: 40, fontSize: 16 }}>OpenAI-compatible. Zero migration effort.</p>
          <CodeDocs />
        </RevealSection>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', textAlign: 'center' }}>
        <RevealSection>
          <div style={{ background: 'linear-gradient(135deg, rgba(240,185,11,0.1), rgba(240,185,11,0.05))', border: '1px solid rgba(240,185,11,0.2)', borderRadius: 20, padding: '60px 40px', maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Ready to Build?</h2>
            <p style={{ color: '#848E9C', marginBottom: 32, fontSize: 16 }}>Connect your wallet and get your API key in seconds.</p>
            <button
              onClick={() => isConnected ? navigate('/dashboard') : setShowModal(true)}
              style={{ background: '#F0B90B', color: '#0B0E11', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              {isConnected ? 'Open Dashboard' : 'Connect Wallet'}
            </button>
          </div>
        </RevealSection>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid #2B3139', padding: '32px 24px', textAlign: 'center', color: '#848E9C', fontSize: 13 }}>
        © 2026 YYClaw. All rights reserved.
      </footer>

      {showModal && <WalletModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
