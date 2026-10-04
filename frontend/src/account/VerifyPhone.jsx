import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function VerifyPhone() {
  const { t } = useTranslation()
  const { username } = useParams()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [step, setStep] = useState('idle')       // 'idle' | 'code'
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  // Guard: must be the owner
  useEffect(() => {
    if (!user) return
    if (username && username !== user.username) {
      navigate('/')
    }
  }, [user, username, navigate])

  const profile = user?.profile || {}
  const phone = profile.phone || ''
  const alreadyVerified = profile.is_phone_verified

  const profilePath = user?.is_artisan
    ? `/artisan_profile/${user.username}`
    : `/profile/${user.username}`

  const handleSend = async () => {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await api.post(`/auth/send-phone-verification/${user.username}/`)
      setStep('code')
      setInfo(t('Verification code sent to your phone.'))
    } catch (err) {
      const data = err.response?.data
      if (data?.detail) setError(data.detail)
      else if (data) setError(Object.values(data).flat().join(' '))
      else setError(t('Failed to send verification code.'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await api.post(`/auth/verify-phone/${user.username}/`, { code })
      await refreshUser()
      // Redirect to profile with a success hint (via state, we don't have a toast yet)
      navigate(profilePath, { state: { message: t('Phone verified successfully.') } })
    } catch (err) {
      const data = err.response?.data
      if (data?.code) setError(Array.isArray(data.code) ? data.code.join(' ') : data.code)
      else if (data?.detail) setError(data.detail)
      else setError(t('Invalid verification code.'))
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  return (
    <section className="py-4 py-md-5">
      <div className="container-lg">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="saaf-dashboard-card rounded-4 p-4 p-md-5">
              <p className="saaf-eyebrow mb-2">{t('Phone Verification')}</p>
              <h1 className="saaf-section-title mb-3">{t('Verify Your Phone')}</h1>

              {alreadyVerified ? (
                <>
                  <div className="alert alert-success d-flex align-items-center gap-2">
                    <i className="bi bi-patch-check-fill"></i>
                    {t('Your phone number is already verified.')}
                  </div>
                  <Link to={profilePath} className="btn btn-saaf-outline rounded-pill">
                    {t('Back to Profile')}
                  </Link>
                </>
              ) : !phone ? (
                <>
                  <div className="alert alert-warning">
                    {t('Please add your phone number first.')}
                  </div>
                  <Link
                    to={`${profilePath}/update`}
                    className="btn btn-saaf-primary rounded-pill"
                  >
                    {t('Update Profile')}
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-muted mb-4">
                    {t('We will send a 6-digit code to')}{' '}
                    <strong>{phone}</strong>. {t('Enter it below to verify your number.')}
                  </p>

                  {error && <div className="alert alert-danger">{error}</div>}
                  {info && <div className="alert alert-info">{info}</div>}

                  {step === 'idle' ? (
                    <div className="d-grid gap-2">
                      <button
                        type="button"
                        className="btn btn-saaf-primary rounded-pill"
                        onClick={handleSend}
                        disabled={loading}
                      >
                        {loading ? t('Sending...') : t('Send Verification Code')}
                      </button>
                      <Link to={profilePath} className="btn btn-saaf-outline rounded-pill">
                        {t('Back to Profile')}
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleVerify}>
                      <div className="mb-3">
                        <label htmlFor="code" className="form-label">
                          {t('Verification Code')}
                        </label>
                        <input
                          type="text"
                          id="code"
                          className="form-control form-control-lg text-center"
                          placeholder="000000"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          required
                          style={{ letterSpacing: '.35em', fontWeight: 700 }}
                        />
                        <div className="form-text">
                          {t('Did not receive the code?')}{' '}
                          <button
                            type="button"
                            className="btn btn-link p-0 align-baseline"
                            onClick={handleSend}
                            disabled={loading}
                          >
                            {t('Resend code')}
                          </button>
                        </div>
                      </div>

                      <div className="d-grid gap-2">
                        <button
                          type="submit"
                          className="btn btn-saaf-primary rounded-pill"
                          disabled={loading || code.length < 4}
                        >
                          {loading ? t('Verifying...') : t('Verify')}
                        </button>
                        <Link to={profilePath} className="btn btn-saaf-outline rounded-pill">
                          {t('Cancel')}
                        </Link>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}