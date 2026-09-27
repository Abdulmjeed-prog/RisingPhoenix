import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h1>Welcome, {user.username} 👋</h1>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Artisan:</strong> {user.is_artisan ? 'Yes' : 'No'}</p>

      <h2>Profile</h2>
      <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflow: 'auto' }}>
        {JSON.stringify(user.profile, null, 2)}
      </pre>

      <button onClick={logout} style={{ padding: 10, marginTop: 12 }}>Logout</button>
    </div>
  )
}