import { useEffect, useState } from 'react'

const card = { background: '#181A20', border: '1px solid #2B3139', borderRadius: 12, padding: 24 }
const btnSm = (bg, color) => ({
  background: bg, color, border: 'none', borderRadius: 6, padding: '6px 14px',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
})

export default function Users({ apiFetch }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [topupId, setTopupId] = useState(null)
  const [topupAmt, setTopupAmt] = useState('')

  const load = () => {
    apiFetch('/admin/api/users').then(r => r.json()).then(d => { setUsers(d); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [apiFetch])

  const doTopup = async (id) => {
    const amt = parseFloat(topupAmt)
    if (!amt || isNaN(amt)) return
    await apiFetch(`/admin/api/users/${id}/topup`, { method: 'POST', body: JSON.stringify({ amount: amt }) })
    setTopupId(null); setTopupAmt(''); load()
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Users</h1>
      <div style={card}>
        {loading ? <div style={{ color: '#848E9C' }}>Loading...</div> : (
          <table>
            <thead>
              <tr><th>Wallet</th><th>Balance</th><th>API Key</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.wallet_address}</td>
                  <td style={{ color: '#0ECB81', fontWeight: 600 }}>${(u.balance || 0).toFixed(4)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#848E9C' }}>{u.api_key ? `${u.api_key.slice(0, 16)}...` : '—'}</td>
                  <td style={{ color: '#848E9C', fontSize: 12 }}>{new Date(u.created_at * 1000).toLocaleDateString()}</td>
                  <td>
                    {topupId === u.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          style={{ width: 80, padding: '4px 8px', fontSize: 12 }}
                          type="number" step="0.01" placeholder="$"
                          value={topupAmt} onChange={e => setTopupAmt(e.target.value)}
                          autoFocus
                        />
                        <button style={btnSm('#0ECB81', '#0B0E11')} onClick={() => doTopup(u.id)}>✓</button>
                        <button style={btnSm('transparent', '#848E9C')} onClick={() => setTopupId(null)}>✕</button>
                      </div>
                    ) : (
                      <button style={btnSm('rgba(14,203,129,0.1)', '#0ECB81')} onClick={() => { setTopupId(u.id); setTopupAmt('') }}>Top Up</button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} style={{ color: '#848E9C', textAlign: 'center', padding: 20 }}>No users</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
