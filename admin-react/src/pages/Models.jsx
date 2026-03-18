import { useEffect, useState } from 'react'

const card = { background: '#181A20', border: '1px solid #2B3139', borderRadius: 12, padding: 24 }
const btnSm = (bg, color) => ({
  background: bg, color, border: 'none', borderRadius: 6, padding: '6px 14px',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s',
})

export default function Models({ apiFetch }) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', upstream_url: '', upstream_key: '', upstream_model: '', price_per_call: 0, enabled: true })

  const load = () => {
    apiFetch('/admin/api/models').then(r => r.json()).then(d => { setModels(d); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [apiFetch])

  const resetForm = () => setForm({ name: '', upstream_url: '', upstream_key: '', upstream_model: '', price_per_call: 0, enabled: true })

  const save = async () => {
    if (editId) {
      await apiFetch(`/admin/api/models/${editId}`, { method: 'PUT', body: JSON.stringify(form) })
    } else {
      await apiFetch('/admin/api/models', { method: 'POST', body: JSON.stringify(form) })
    }
    setShowAdd(false); setEditId(null); resetForm(); load()
  }

  const del = async (id) => {
    if (!confirm('Delete this model?')) return
    await apiFetch(`/admin/api/models/${id}`, { method: 'DELETE' })
    load()
  }

  const startEdit = (m) => {
    setEditId(m.id)
    setForm({ name: m.name, upstream_url: m.upstream_url, upstream_key: m.upstream_key, upstream_model: m.upstream_model, price_per_call: m.price_per_call, enabled: !!m.enabled })
    setShowAdd(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Models</h1>
        <button style={btnSm('#F0B90B', '#0B0E11')} onClick={() => { resetForm(); setEditId(null); setShowAdd(true) }}>+ Add Model</button>
      </div>

      {showAdd && (
        <div style={{ ...card, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{editId ? 'Edit Model' : 'Add Model'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#848E9C', display: 'block', marginBottom: 4 }}>Name</label>
              <input style={{ width: '100%' }} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={!!editId} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#848E9C', display: 'block', marginBottom: 4 }}>Price / Call ($)</label>
              <input style={{ width: '100%' }} type="number" step="0.001" value={form.price_per_call} onChange={e => setForm(f => ({ ...f, price_per_call: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#848E9C', display: 'block', marginBottom: 4 }}>Upstream URL</label>
              <input style={{ width: '100%' }} value={form.upstream_url} onChange={e => setForm(f => ({ ...f, upstream_url: e.target.value }))} placeholder="https://api.openai.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#848E9C', display: 'block', marginBottom: 4 }}>Upstream Model</label>
              <input style={{ width: '100%' }} value={form.upstream_model} onChange={e => setForm(f => ({ ...f, upstream_model: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: '#848E9C', display: 'block', marginBottom: 4 }}>Upstream Key</label>
              <input style={{ width: '100%' }} type="password" value={form.upstream_key} onChange={e => setForm(f => ({ ...f, upstream_key: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#848E9C', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} /> Enabled
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btnSm('#F0B90B', '#0B0E11')} onClick={save}>Save</button>
            <button style={btnSm('transparent', '#848E9C')} onClick={() => { setShowAdd(false); setEditId(null) }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={card}>
        {loading ? <div style={{ color: '#848E9C' }}>Loading...</div> : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Upstream</th><th>Price</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map(m => (
                <tr key={m.id}>
                  <td style={{ fontFamily: 'monospace', color: '#EAECEF' }}>{m.name}</td>
                  <td style={{ color: '#848E9C', fontSize: 12 }}>{m.upstream_model || '—'}</td>
                  <td style={{ color: '#F0B90B', fontWeight: 600 }}>${m.price_per_call}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                      background: m.enabled ? 'rgba(14,203,129,0.15)' : 'rgba(246,70,93,0.15)',
                      color: m.enabled ? '#0ECB81' : '#F6465D',
                    }}>{m.enabled ? 'ON' : 'OFF'}</span>
                  </td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button style={btnSm('rgba(240,185,11,0.1)', '#F0B90B')} onClick={() => startEdit(m)}>Edit</button>
                    <button style={btnSm('rgba(246,70,93,0.1)', '#F6465D')} onClick={() => del(m.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {models.length === 0 && <tr><td colSpan={5} style={{ color: '#848E9C', textAlign: 'center', padding: 20 }}>No models</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
