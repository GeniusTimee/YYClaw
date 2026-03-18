import { useEffect, useState } from 'react'

const card = { background: '#181A20', border: '1px solid #2B3139', borderRadius: 12, padding: 24 }

export default function Dashboard({ apiFetch }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    apiFetch('/admin/api/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [apiFetch])

  const items = stats ? [
    { label: 'Total Users', value: stats.total_users, color: '#EAECEF' },
    { label: 'Total Calls', value: stats.total_calls, color: '#F0B90B' },
    { label: 'Total Revenue', value: `$${(stats.total_revenue || 0).toFixed(4)}`, color: '#0ECB81' },
    { label: 'Today Calls', value: stats.today_calls, color: '#EAECEF' },
    { label: 'Today Revenue', value: `$${(stats.today_revenue || 0).toFixed(4)}`, color: '#0ECB81' },
  ] : []

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Dashboard</h1>
      {!stats ? (
        <div style={{ color: '#848E9C' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {items.map(it => (
            <div key={it.label} style={card}>
              <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{it.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: it.color }}>{it.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
