import { useEffect, useState } from 'react'
import { API_BASE } from '../config'

const card = {
  background: '#181A20', border: '1px solid #2B3139', borderRadius: 12, padding: 24,
}

function displayName(id) {
  return id.replace(/-fixed$/, '')
}

function displayPrice(price) {
  return (price / 10).toFixed(4)
}

export default function PriceTable() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/v1/models`)
      .then(r => r.json())
      .then(d => { setModels((d.data || []).sort((a, b) => b.price_per_call - a.price_per_call)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={card}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAECEF', marginBottom: 16 }}>Model Pricing</h3>
      {loading ? (
        <div style={{ color: '#848E9C', fontSize: 14 }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2B3139' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#848E9C', fontWeight: 500 }}>Model</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#848E9C', fontWeight: 500 }}>Price / Call</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: i < models.length - 1 ? '1px solid #2B3139' : 'none' }}>
                  <td style={{ padding: '10px 12px', color: '#EAECEF', fontFamily: 'monospace' }}>{displayName(m.id)}</td>
                  <td style={{ padding: '10px 12px', color: '#F0B90B', textAlign: 'right', fontWeight: 600 }}>
                    ${displayPrice(m.price_per_call)}
                  </td>
                </tr>
              ))}
              {models.length === 0 && (
                <tr><td colSpan={2} style={{ padding: '16px 12px', color: '#848E9C', textAlign: 'center' }}>No models available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
