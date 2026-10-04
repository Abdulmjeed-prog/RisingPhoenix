import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import Login from './account/Login'
import Register from './account/Register'
import RegisterArtisan from './account/RegisterArtisan'
import Dashboard from './account/Dashboard'
import Home from './main/Home'
import About from './main/About'
import Terms from './main/Terms'
import Browse from './main/Browse'
import ArtisanDashboard from './account/ArtisanDashboard'
import Profile from './account/Profile'
import UpdateProfile from './account/UpdateProfile'
import VerifyPhone from './account/VerifyPhone'
import ForgotPassword from './account/ForgotPassword'
import PasswordResetDone from './account/PasswordResetDone'
import ResetPassword from './account/ResetPassword'
import PasswordResetComplete from './account/PasswordResetComplete'


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
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/password-reset" element={<ForgotPassword />} />
            <Route path="/password-reset/done" element={<PasswordResetDone />} />
            <Route path="/reset/:uidb64/:token" element={<ResetPassword />} />
            <Route path="/reset/done" element={<PasswordResetComplete />} />

          </Route>

          {/* Protected pages — WITH layout, login required */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/artisan/dashboard" element={<ArtisanDashboard />} />
            <Route path="/profile/:username/update" element={<UpdateProfile />} />
            <Route path="/artisan_profile/:username/update" element={<UpdateProfile />} />
            <Route path="/profile/:username/verify-phone" element={<VerifyPhone />} />
            <Route path="/artisan_profile/:username/verify-phone" element={<VerifyPhone />} />
            {/* Add more protected routes here later */}
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}