import { useEffect, useState } from 'react'

const card = {
  background: '#181A20', border: '1px solid #2B3139', borderRadius: 12, padding: 24,
}

const statusColor = { success: '#0ECB81', error: '#F6465D', pending: '#F0B90B' }

export default function CallLogs({ authFetch }) {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authFetch) return
    Promise.all([
      authFetch('/api/billing/logs').then(r => r.json()),
      authFetch('/api/billing/stats').then(r => r.json()),
    ]).then(([logsData, statsData]) => {
      setLogs(Array.isArray(logsData) ? logsData : [])
      setStats(statsData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [authFetch])

  return (
    <div style={card}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAECEF', marginBottom: 16 }}>API Call Logs</h3>

      {stats && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: '#0B0E11', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 4 }}>Total Calls</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#EAECEF' }}>{stats.total_calls ?? 0}</div>
          </div>
          <div style={{ flex: 1, background: '#0B0E11', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: '#848E9C', marginBottom: 4 }}>Total Spent</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F0B90B' }}>${stats.total_spent ?? '0.00'}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#848E9C', fontSize: 14 }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2B3139' }}>
                {['Model', 'Cost', 'Status', 'Time'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#848E9C', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} style={{ borderBottom: i < logs.length - 1 ? '1px solid #2B3139' : 'none' }}>
                  <td style={{ padding: '10px 12px', color: '#EAECEF', fontFamily: 'monospace' }}>{log.model.replace(/-fixed$/, '')}</td>
                  <td style={{ padding: '10px 12px', color: '#F0B90B' }}>${log.cost}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      color: statusColor[log.status] || '#848E9C',
                      background: `${statusColor[log.status] || '#848E9C'}22`,
                      borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600,
                    }}>{log.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#848E9C' }}>
                    {new Date(log.created_at * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '20px 12px', color: '#848E9C', textAlign: 'center' }}>No calls yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
