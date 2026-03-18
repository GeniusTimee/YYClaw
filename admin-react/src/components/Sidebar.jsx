import { useNavigate, useLocation } from 'react-router-dom'

const items = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/models', label: 'Models', icon: '🤖' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/logs', label: 'Logs', icon: '📋' },
]

const s = {
  sidebar: {
    width: 220, background: '#181A20', borderRight: '1px solid #2B3139',
    display: 'flex', flexDirection: 'column', padding: '20px 0',
  },
  logo: {
    fontSize: 20, fontWeight: 800, color: '#F0B90B', padding: '0 20px 24px',
    borderBottom: '1px solid #2B3139', marginBottom: 16, letterSpacing: '-0.5px',
  },
  item: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
    fontSize: 14, fontWeight: active ? 600 : 400, cursor: 'pointer',
    color: active ? '#F0B90B' : '#848E9C', background: active ? 'rgba(240,185,11,0.08)' : 'transparent',
    borderLeft: active ? '3px solid #F0B90B' : '3px solid transparent',
    transition: 'all 0.15s',
  }),
  logout: {
    marginTop: 'auto', padding: '12px 20px', fontSize: 13, color: '#F6465D',
    cursor: 'pointer', borderTop: '1px solid #2B3139',
  },
}

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div style={s.sidebar}>
      <div style={s.logo}>⚡ YYClaw Admin</div>
      {items.map(it => (
        <div
          key={it.path}
          style={s.item(pathname === it.path)}
          onClick={() => navigate(it.path)}
        >
          <span>{it.icon}</span> {it.label}
        </div>
      ))}
      <div style={s.logout} onClick={onLogout}>🚪 Logout</div>
    </div>
  )
}
