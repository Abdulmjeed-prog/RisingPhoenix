import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

export default function ResetPassword() {
  const { t } = useTranslation()
  const { uidb64, token } = useParams()
  const navigate = useNavigate()

  const [validating, setValidating] = useState(true)
  const [validLink, setValidLink] = useState(false)
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Check token validity on mount
  useEffect(() => {
    api
      .get(`/auth/password-reset/verify/${uidb64}/${token}/`)
      .then((res) => setValidLink(res.data.valid))
      .catch(() => setValidLink(false))
      .finally(() => setValidating(false))
  }, [uidb64, token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await api.post(`/auth/password-reset/confirm/${uidb64}/${token}/`, {
        new_password1: password1,
        new_password2: password2,
      })
      navigate('/reset/done')
    } catch (err) {
      const data = err.response?.data
      if (data?.detail) setErrors({ detail: data.detail })
      else if (data) setErrors(data)
      else setErrors({ detail: t('Something went wrong.') })
    } finally {
      setLoading(false)
    }
  }

  const errFor = (field) => errors[field] && (
    <div className="text-danger small mt-1">
      {Array.isArray(errors[field]) ? errors[field].join(' ') : errors[field]}
    </div>
  )

  if (validating) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-md-5">
              {validLink ? (
                <>
                  <div className="text-center mb-4">
                    <h2 className="fw-bold mb-2">{t('Set New Password')}</h2>
                    <p className="text-muted mb-0">
                      {t('Please enter your new password twice so we can verify it.')}
                    </p>
                  </div>

                  {errors.detail && <div className="alert alert-danger">{errors.detail}</div>}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="password1" className="form-label fw-semibold">
                        {t('New password')}
                      </label>
                      <input
                        type="password"
                        id="password1"
                        className={`form-control ${errors.new_password1 ? 'is-invalid' : ''}`}
                        value={password1}
                        onChange={(e) => setPassword1(e.target.value)}
                        minLength={8}
                        required
                        autoComplete="new-password"
                      />
                      {errFor('new_password1')}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="password2" className="form-label fw-semibold">
                        {t('Confirm new password')}
                      </label>
                      <input
                        type="password"
                        id="password2"
                        className={`form-control ${errors.new_password2 ? 'is-invalid' : ''}`}
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        minLength={8}
                        required
                        autoComplete="new-password"
                      />
                      {errFor('new_password2')}
                    </div>

                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary rounded-pill" disabled={loading}>
                        {loading ? t('Saving...') : t('Change Password')}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <h2 className="fw-bold mb-3">{t('Invalid Reset Link')}</h2>
                  <p className="text-muted mb-4">
                    {t('This password reset link is invalid or has already been used.')}
                  </p>
                  <Link to="/password-reset" className="btn btn-primary rounded-pill px-4">
                    {t('Request New Link')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}