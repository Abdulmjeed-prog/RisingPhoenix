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
import Profile from './account/Profile'
import UpdateProfile from './account/UpdateProfile'
import VerifyPhone from './account/VerifyPhone'
import ForgotPassword from './account/ForgotPassword'
import PasswordResetDone from './account/PasswordResetDone'
import ResetPassword from './account/ResetPassword'
import PasswordResetComplete from './account/PasswordResetComplete'
import ArtisanRevenueDashboard from './account/ArtisanRevenueDashboard'
import RequestList from './request/RequestList'
import MyRequests from './request/MyRequests'
import RequestDetail from './request/RequestDetail'
import RequestForm from './request/RequestForm'

// Small placeholder component for pages not yet built
const Soon = ({ title }) => (
  <div className="container py-5">
    <h1>{title}</h1>
    <p className="text-muted">Coming soon.</p>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ──────────────────────────────────────── */}
          {/* Public pages — WITH layout, NO login required */}
          {/* ──────────────────────────────────────── */}
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
            <Route path="/requests" element={<RequestList />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
          </Route>

          {/* ──────────────────────────────────────── */}
          {/* Protected pages — WITH layout + login */}
          {/* ──────────────────────────────────────── */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile/:username/update" element={<UpdateProfile />} />
            <Route path="/artisan_profile/:username/update" element={<UpdateProfile />} />
            <Route path="/profile/:username/verify-phone" element={<VerifyPhone />} />
            <Route path="/artisan_profile/:username/verify-phone" element={<VerifyPhone />} />
            <Route path="/artisan/dashboard" element={<ArtisanRevenueDashboard />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/requests/new" element={<RequestForm />} />
            <Route path="/requests/:id/edit" element={<RequestForm editMode />} />

            {/* ── Placeholders — replace as we build each page ── */}
            <Route path="/messages" element={<Soon title="Messages" />} />
            <Route path="/messages/:id" element={<Soon title="Conversation" />} />
            <Route path="/notifications" element={<Soon title="Notifications" />} />
            <Route path="/proposals" element={<Soon title="My Proposals" />} />
            <Route path="/portfolio/upload" element={<Soon title="Upload Portfolio" />} />
            <Route path="/my-cards" element={<Soon title="My Cards" />} />
            <Route path="/workshop/:id" element={<Soon title="Workshop" />} />
            <Route path="/contracts/:id" element={<Soon title="Contract" />} />
            <Route path="/completed-orders" element={<Soon title="Completed Orders" />} />
            <Route path="/staff" element={<Soon title="Staff Dashboard" />} />
            <Route path="/staff/profile" element={<Soon title="Staff Profile" />} />
          </Route>

          {/* ──────────────────────────────────────── */}
          {/* 404 fallback — must be last */}
          {/* ──────────────────────────────────────── */}
          <Route path="*" element={<Soon title="Page not found" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}