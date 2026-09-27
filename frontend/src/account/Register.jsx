import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { useAuth } from '../context/AuthContext'
import DefaultAvatarPicker from '../components/DefaultAvatarPicker'

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '',
    password: '', password2: '', bio: '',
  })
  const [phone, setPhone] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [defaultAvatar, setDefaultAvatar] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const fd = new FormData()
    fd.append('username', form.username)
    fd.append('first_name', form.first_name)
    fd.append('last_name', form.last_name)
    fd.append('email', form.email)
    fd.append('password', form.password)
    fd.append('password2', form.password2)
    fd.append('phone', phone)
    fd.append('bio', form.bio)

    if (avatarFile) fd.append('avatar', avatarFile)
    else if (defaultAvatar) fd.append('default_avatar', defaultAvatar)

    try {
      await register(fd)
      navigate('/dashboard')
    } catch (err) {
      setErrors(err.response?.data || { detail: 'Registration failed.' })
    } finally {
      setLoading(false)
    }
  }

  const errFor = (field) => errors[field] && (
    <div className="invalid-feedback d-block">
      {Array.isArray(errors[field]) ? errors[field].join(', ') : errors[field]}
    </div>
  )

  return (
    <section className="py-5">
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100 py-4">
          <div className="col-lg-10 col-xl-8">
            <div className="card saaf-auth-card shadow-sm border-0">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h1 className="h3 mb-2">{t('Sign Up')}</h1>
                  <p className="text-muted mb-0">{t('Create your account in a few simple steps.')}</p>
                </div>

                {errors.detail && (
                  <div className="alert alert-danger">{errors.detail}</div>
                )}
                {errors.non_field_errors && (
                  <div className="alert alert-danger">{errors.non_field_errors.join(', ')}</div>
                )}

                <form onSubmit={handleSubmit} className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">{t('First Name')}</label>
                    <input
                      type="text"
                      className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                      value={form.first_name}
                      onChange={update('first_name')}
                      placeholder={t('Enter your first name')}
                      required
                    />
                    {errFor('first_name')}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t('Last Name')}</label>
                    <input
                      type="text"
                      className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                      value={form.last_name}
                      onChange={update('last_name')}
                      placeholder={t('Enter your last name')}
                      required
                    />
                    {errFor('last_name')}
                  </div>

                  <div className="col-12">
                    <label className="form-label">{t('Username')}</label>
                    <input
                      type="text"
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      value={form.username}
                      onChange={update('username')}
                      placeholder={t('Choose a username')}
                      required
                      minLength={5}
                      maxLength={20}
                    />
                    {errFor('username')}
                  </div>

                  <div className="col-12">
                    <label className="form-label">{t('Email')}</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={form.email}
                      onChange={update('email')}
                      placeholder={t('Enter your email')}
                      required
                    />
                    {errFor('email')}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t('Password')}</label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      value={form.password}
                      onChange={update('password')}
                      placeholder={t('Enter your password')}
                      required
                      minLength={8}
                    />
                    {errFor('password')}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t('Confirm Password')}</label>
                    <input
                      type="password"
                      className={`form-control ${errors.password2 ? 'is-invalid' : ''}`}
                      value={form.password2}
                      onChange={update('password2')}
                      placeholder={t('Confirm your password')}
                      required
                      minLength={8}
                    />
                    {errFor('password2')}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t('Phone')}</label>
                    <PhoneInput
                      defaultCountry="sa"
                      value={phone}
                      onChange={setPhone}
                      inputClassName={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    />
                    <div className="form-text">{t('Select your country then enter your number.')}</div>
                    {errFor('phone')}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t('Upload Your Avatar')}</label>
                    <input
                      type="file"
                      className={`form-control ${errors.avatar ? 'is-invalid' : ''}`}
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      accept="image/*"
                    />
                    <div className="form-text">
                      {t('You can upload your own image or choose one of the default avatars below.')}
                    </div>
                    {errFor('avatar')}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label d-block">{t('Or choose a default avatar')}</label>
                    <DefaultAvatarPicker value={defaultAvatar} onChange={setDefaultAvatar} />
                  </div>

                  <div className="col-12">
                    <label className="form-label">{t('Bio')}</label>
                    <textarea
                      className={`form-control ${errors.bio ? 'is-invalid' : ''}`}
                      rows="4"
                      value={form.bio}
                      onChange={update('bio')}
                      placeholder={t('Write something about yourself')}
                    ></textarea>
                    {errFor('bio')}
                  </div>

                  <div className="col-12 d-grid">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? t('Creating account...') : t('Create Account')}
                    </button>
                  </div>

                  <div className="col-12">
                    <p className="text-center mb-0">
                      {t('Already have an account?')} <Link to="/login">{t('Sign in')}</Link>
                    </p>
                    <p className="text-center mb-0">
                      <Link to="/register/artisan">{t('Are you an artisan?')}</Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}