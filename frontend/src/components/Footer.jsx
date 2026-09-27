import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function Footer() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const isArtisan = user?.is_artisan

  return (
    <footer className="saaf-footer mt-5 pt-5 pb-4">
      <div className="container-lg">
        <div className="row mb-5 g-4">
          {/* Brand */}
          <div className="col-md-3">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="saaf-logo">
                <img src="/images/logo.png" alt="Saaf" className="saaf-logo-img" />
              </div>
              <h5 className="brand-name mb-0">Saaf</h5>
            </div>
            <p className="text-muted small">
              {t('Connecting Saudi artisans with customers seeking custom handmade pieces.')}
            </p>
          </div>

          {/* Platform links */}
          <div className="col-md-3">
            <h6 className="mb-3 fw-bold">{t('Platform')}</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/" className="text-decoration-none saaf-footer-link">{t('Home')}</Link></li>
              <li className="mb-2"><Link to="/browse" className="text-decoration-none saaf-footer-link">{t('Browse Artisans')}</Link></li>
              <li className="mb-2"><Link to="/requests" className="text-decoration-none saaf-footer-link">{t('Requests')}</Link></li>
              <li className="mb-2"><Link to="/requests/new" className="text-decoration-none saaf-footer-link">{t('Post a Request')}</Link></li>
              <li className="mb-2"><Link to="/register/artisan" className="text-decoration-none saaf-footer-link">{t('Become an Artisan')}</Link></li>
              <li className="mb-2"><Link to="/about" className="text-decoration-none saaf-footer-link">{t('About Us')}</Link></li>
              <li className="mb-2"><Link to="/members" className="text-decoration-none saaf-footer-link">{t('Members')}</Link></li>
              <li className="mb-2"><Link to="/terms" className="text-decoration-none saaf-footer-link">{t('Terms')}</Link></li>
            </ul>
          </div>

          {/* Account links */}
          <div className="col-md-3">
            <h6 className="mb-3 fw-bold">{t('Account')}</h6>
            <ul className="list-unstyled small">
              {user ? (
                <>
                  <li className="mb-2"><Link to="/messages" className="text-decoration-none saaf-footer-link">{t('Messages')}</Link></li>
                  {isArtisan ? (
                    <>
                      <li className="mb-2"><Link to="/proposals" className="text-decoration-none saaf-footer-link">{t('My Proposals')}</Link></li>
                      <li className="mb-2"><Link to="/artisan/dashboard" className="text-decoration-none saaf-footer-link">{t('Dashboard')}</Link></li>
                    </>
                  ) : (
                    <li className="mb-2"><Link to="/dashboard" className="text-decoration-none saaf-footer-link">{t('Dashboard')}</Link></li>
                  )}
                  <li className="mb-2"><Link to="/logout" className="text-decoration-none saaf-footer-link">{t('Log out')}</Link></li>
                </>
              ) : (
                <>
                  <li className="mb-2"><Link to="/login" className="text-decoration-none saaf-footer-link">{t('Log in')}</Link></li>
                  <li className="mb-2"><Link to="/register" className="text-decoration-none saaf-footer-link">{t('Sign up')}</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Social */}
          <div className="col-md-3">
            <h6 className="mb-3 fw-bold">{t('Follow Us')}</h6>
            <div className="d-flex gap-2">
              <a href="/" className="saaf-social-icon" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="/" className="saaf-social-icon" aria-label="Twitter X"><i className="bi bi-twitter-x"></i></a>
              <a href="/" className="saaf-social-icon" aria-label="TikTok"><i className="bi bi-tiktok"></i></a>
              <a href="/" className="saaf-social-icon" aria-label="Pinterest"><i className="bi bi-pinterest"></i></a>
            </div>
          </div>
        </div>

        <hr className="saaf-border-hr" />
        <div className="text-center text-muted small pt-3">
          <p>© 2026 Saaf. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}