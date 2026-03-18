import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Models from './pages/Models'
import Users from './pages/Users'
import Logs from './pages/Logs'
import Sidebar from './components/Sidebar'

const ADMIN_KEY_STORAGE = 'yyclaw_admin_key'

export default function App() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) || '')
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    if (!adminKey) { setAuthed(false); return }
    fetch('/admin/api/stats', { headers: { 'x-admin-key': adminKey } })
      .then(r => { if (r.ok) setAuthed(true); else { setAuthed(false); localStorage.removeItem(ADMIN_KEY_STORAGE) } })
      .catch(() => setAuthed(false))
  }, [adminKey])

  const login = (key) => {
    localStorage.setItem(ADMIN_KEY_STORAGE, key)
    setAdminKey(key)
  }

  const logout = () => {
    localStorage.removeItem(ADMIN_KEY_STORAGE)
    setAdminKey('')
    setAuthed(false)
  }

  const apiFetch = async (url, opts = {}) => {
    return fetch(url, { ...opts, headers: { ...opts.headers, 'x-admin-key': adminKey, 'Content-Type': 'application/json' } })
  }

  if (!authed) return (
    <BrowserRouter basename="/admin">
      <Login onLogin={login} />
    </BrowserRouter>
  )

  return (
    <BrowserRouter basename="/admin">
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar onLogout={logout} />
        <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard apiFetch={apiFetch} />} />
            <Route path="/models" element={<Models apiFetch={apiFetch} />} />
            <Route path="/users" element={<Users apiFetch={apiFetch} />} />
            <Route path="/logs" element={<Logs apiFetch={apiFetch} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
