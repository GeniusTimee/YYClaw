import { useState, useEffect } from 'react'
import './Hero.css'

const TYPEWRITER = [
  'No subscriptions. Just API calls.',
  'Claude + Gemini. One endpoint.',
  'Pay with USD1, USDT or USDC.',
  'OpenAI compatible. Drop-in ready.',
]

export default function Hero({ onConnect }) {
  const [text, setText] = useState('')
  const [idx, setIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const target = TYPEWRITER[idx]
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(target.slice(0, text.length + 1))
        if (text.length + 1 === target.length) setTimeout(() => setDeleting(true), 1800)
      } else {
        setText(target.slice(0, text.length - 1))
        if (text.length - 1 === 0) { setDeleting(false); setIdx((idx + 1) % TYPEWRITER.length) }
      }
    }, deleting ? 40 : 80)
    return () => clearTimeout(timeout)
  }, [text, idx, deleting])

  return (
    <section className="hero">
      <div className="hero-left">
        <div className="hero-badge">
          <span className="badge-dot" />
          Live on BSC &amp; Base
        </div>
        <h1 className="hero-title">
          Pay-Per-Call<br />
          <span className="gradient-text">AI Gateway</span>
        </h1>
        <p className="hero-typewriter">{text}<span className="cursor">|</span></p>
        <p className="hero-desc">
          Connect your wallet, authorize once, and call any model. No monthly fees, no API key management hassle.
        </p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={onConnect}>Get Started →</button>
          <a className="btn-ghost" href="#docs">View Docs</a>
        </div>
      </div>
      <div className="hero-right">
        {[
          { name: 'gemini-2.5-flash-fixed', price: '$0.010' },
          { name: 'gemini-3-flash-fixed',   price: '$0.020' },
          { name: 'claude-haiku-4.5-fixed', price: '$0.064' },
          { name: 'claude-sonnet-4-6-fixed',price: '$0.100' },
          { name: 'claude-opus-4.6-fixed',  price: '$0.160', pro: true },
        ].map(m => (
          <div key={m.name} className="price-card">
            <span className="price-name">{m.name}</span>
            <span className="price-val">{m.price}<span>/call</span></span>
            {m.pro && <span className="pro-tag">PRO</span>}
          </div>
        ))}
      </div>
    </section>
  )
}
