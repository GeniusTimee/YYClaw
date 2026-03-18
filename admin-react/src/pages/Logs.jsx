import { useEffect, useState } from 'react'

const card = { background: '#181A20', border: '1px solid #2B3139', borderRadius: 12, padding: 24 }

export default function Logs({ apiFetch }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/admin/api/logs').then(r => r.json()).then(d => { setLogs(d); setLoading(false) }).catch(() => setLoading(false))
  }, [apiFetch])

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Call Logs</h1>
      <div style={card}>
        {loading ? <div style={{ color: '#848E9C' }}>Loading...</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Wallet</th><th>Model</th><th>Cost</th><th>Status</th><th>Time</th></tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#848E9C' }}>
                      {l.wallet_address ? `${l.wallet_address.slice(0, 8)}...${l.wallet_address.slice(-4)}` : '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#EAECEF' }}>{l.model}</td>
                    <td style={{ color: '#F0B90B', fontWeight: 600 }}>${l.cost}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: l.status?.includes('success') ? 'rgba(14,203,129,0.15)' : 'rgba(246,70,93,0.15)',
                        color: l.status?.includes('success') ? '#0ECB81' : '#F6465D',
                      }}>{l.status}</span>
                    </td>
                    <td style={{ color: '#848E9C', fontSize: 12 }}>{new Date(l.created_at * 1000).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={5} style={{ color: '#848E9C', textAlign: 'center', padding: 20 }}>No logs</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
