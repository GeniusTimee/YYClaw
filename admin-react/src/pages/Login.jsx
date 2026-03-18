import { useState } from 'react'

const s = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 },
  card: { background: '#181A20', border: '1px solid #2B3139', borderRadius: 16, padding: 40, width: 380, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: 800, color: '#F0B90B', marginBottom: 8 },
  sub: { fontSize: 14, color: '#848E9C', marginBottom: 28 },
  input: { width: '100%', padding: '11px 14px', fontSize: 14, marginBottom: 16 },
  btn: {
    width: '100%', background: '#F0B90B', color: '#0B0E11', border: 'none',
    borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
  },
  err: { color: '#F6465D', fontSize: 13, marginBottom: 12 },
}

export default function Login({ onLogin }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/admin/api/stats', { headers: { 'x-admin-key': key.trim() } })
      if (res.ok) {
        onLogin(key.trim())
      } else {
        setError('Invalid admin key')
      }
    } catch {
      setError('Connection failed')
    }
    setLoading(false)
  }

  return (
    <div style={s.wrap}>
      <form style={s.card} onSubmit={submit}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
        <div style={s.title}>YYClaw Admin</div>
        <div style={s.sub}>Enter admin key to continue</div>
        {error && <div style={s.err}>{error}</div>}
        <input
          style={s.input}
          type="password"
          placeholder="Admin Key"
          value={key}
          onChange={e => setKey(e.target.value)}
          autoFocus
        />
        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
          {loading ? 'Verifying...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
