import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import Login from './account/Login'
import Register from './account/Register'
import RegisterArtisan from './account/RegisterArtisan'
import Dashboard from './account/Dashboard'
import Home from './main/Home'
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public pages — WITH layout (navbar + footer), NO login required */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/artisan" element={<RegisterArtisan />} />
          </Route>

          {/* Protected pages — WITH layout, login required */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add more protected routes here later */}
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}