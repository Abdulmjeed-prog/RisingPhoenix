import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { useLanguage } from '../hooks/useLanguage'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, toggle: toggleLang } = useLanguage()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [hidden, setHidden] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Hide navbar on scroll down (from base.html)
  useEffect(() => {
    let lastY = 0
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY
      if (delta > 5 && y > 100) setHidden(true)
      else if (delta < -5) setHidden(false)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isArtisan = user?.is_artisan
  const isStaff = user?.is_staff

  const isActive = (path) => location.pathname === path

  return (
    <nav className={`navbar navbar-expand-lg saaf-nav-wrapper ${hidden ? 'hidden' : ''}`}>
      <div className="container-fluid px-3 px-lg-4 saaf-nav-container">
        {/* Logo */}
        <Link className="navbar-brand" to="/">
          <div className="saaf-logo">
            <img src="/images/logo.png" alt="Saaf" className="saaf-logo-img" />
          </div>
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible area */}
        <div className={`collapse navbar-collapse ${mobileOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-lg-3">
            <li className="nav-item">
              <Link className={`nav-link saaf-nav-link ${isActive('/') ? 'active' : ''}`} to="/">
                {t('Home')}
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link saaf-nav-link ${isActive('/browse') ? 'active' : ''}`} to="/browse">
                {t('Browse Artisans')}
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link saaf-nav-link ${isActive('/requests') ? 'active' : ''}`} to="/requests">
                {t('Requests')}
              </Link>
            </li>

            {/* Authenticated links */}
            {user ? (
              isArtisan ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link saaf-nav-link" to={`/workshop/${user.id}`}>
                      {t('My Workshop')}
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link saaf-nav-link" to="/proposals">
                      {t('My Proposals')}
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className={`nav-link saaf-nav-link ${isActive('/my-requests') ? 'active' : ''}`} to="/my-requests">
                      {t('My Requests')}
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link saaf-nav-link ${isActive('/requests/new') ? 'active' : ''}`} to="/requests/new">
                      {t('Post a Request')}
                    </Link>
                  </li>
                </>
              )
            ) : (
              <li className="nav-item">
                <Link className="nav-link saaf-nav-link" to="/register/artisan">
                  {t('Become an Artisan')}
                </Link>
              </li>
            )}

            {/* Mobile-only links */}
            {user && (
              <>
                <li className="nav-item d-lg-none"><hr className="saaf-nav-divider" /></li>
                {isStaff ? (
                  <>
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link saaf-nav-link" to="/staff">{t('Staff Dashboard')}</Link>
                    </li>
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link saaf-nav-link" to="/staff/profile">{t('Profile')}</Link>
                    </li>
                  </>
                ) : isArtisan ? (
                  <>
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link saaf-nav-link" to="/artisan/dashboard">{t('Artisan Dashboard')}</Link>
                    </li>
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link saaf-nav-link" to="/messages">{t('Messages')}</Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link saaf-nav-link" to="/dashboard">{t('Dashboard')}</Link>
                    </li>
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link saaf-nav-link" to="/messages">{t('Messages')}</Link>
                    </li>
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link saaf-nav-link" to={`/profile/${user.username}`}>{t('Profile')}</Link>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>

          {/* Right side */}
          <div className="d-flex gap-2 align-items-center ms-auto">
            {/* Language switch */}
            <button
              type="button"
              onClick={toggleLang}
              className="btn btn-saaf-outline rounded-pill"
              aria-label="Switch language"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-saaf-outline rounded-pill saaf-theme-toggle"
              aria-label="Toggle dark mode"
            >
              <i className={theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars'}></i>
            </button>

            {/* Auth buttons or bell + logout */}
            {user ? (
              <>
                <NotificationBell />
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-saaf-primary rounded-pill"
                >
                  {t('Log out')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-saaf-outline">{t('Log in')}</Link>
                <Link to="/register" className="btn btn-saaf-primary rounded-pill">{t('Sign up')}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}