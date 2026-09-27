import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextUrl = searchParams.get('next')

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(form.username, form.password)

      // If a ?next= URL was provided (e.g. redirected from a protected page), use it
      if (nextUrl) {
        navigate(nextUrl)
        return
      }

      // Otherwise, route based on role — matches Django's login_view behavior
      if (user.is_staff) {
        navigate('/staff')
      } else if (user.is_artisan) {
        navigate('/artisan/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        t('Your Username or Password is wrong, try again')
      )
    } finally {
      setLoading(false)
    }
  }

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <section className="py-5">
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-md-8 col-lg-5">
            <div className="card saaf-auth-card shadow-sm border-0">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h1 className="h3 mb-2">{t('Login')}</h1>
                  <p className="text-muted mb-0">{t('Sign in to your account')}</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">{t('Username')}</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className={`form-control ${error ? 'is-invalid' : ''}`}
                      value={form.username}
                      onChange={update('username')}
                      placeholder={t('Enter your username')}
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">{t('Password')}</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className={`form-control ${error ? 'is-invalid' : ''}`}
                      value={form.password}
                      onChange={update('password')}
                      placeholder={t('Enter your password')}
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? t('Logging in...') : t('Login')}
                    </button>
                  </div>

                  <p className="text-center mt-3 mb-0">
                    {t("Don't have an account?")} <Link to="/register">{t('Sign Up')}</Link>
                  </p>
                  <p className="text-center mb-0">
                    <Link to="/password-reset">{t('Forgot Your Password?')}</Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}