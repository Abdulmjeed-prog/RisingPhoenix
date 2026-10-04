import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/password-reset/', { email })
      navigate('/password-reset/done')
    } catch (err) {
      const data = err.response?.data
      if (data?.email) setError(Array.isArray(data.email) ? data.email.join(' ') : data.email)
      else setError(t('Please enter a valid email address.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">{t('Reset Password')}</h2>
                <p className="text-muted mb-0">
                  {t("Enter your email address and we'll send you a link to reset your password.")}
                </p>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold">
                    {t('Email address')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={`form-control ${error ? 'is-invalid' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary rounded-pill" disabled={loading}>
                    {loading ? t('Sending...') : t('Send Reset Link')}
                  </button>
                </div>
              </form>

              <div className="text-center mt-4">
                <Link to="/login" className="text-decoration-none">
                  {t('Back to login')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}