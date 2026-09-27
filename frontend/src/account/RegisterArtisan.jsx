import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { useAuth } from '../context/AuthContext'
import DefaultAvatarPicker from '../components/DefaultAvatarPicker'

export default function RegisterArtisan() {
  const { t } = useTranslation()
  const { registerArtisan } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
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
      await registerArtisan(fd)
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
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-7 col-md-9">
          <div className="card saaf-auth-card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-md-5">
              <h2 className="mb-3 text-center">{t('Create Artisan Account')}</h2>
              <p className="text-muted text-center mb-4">
                {t('Join as an artisan and showcase your work, receive proposals, and grow your profile.')}
              </p>

              {errors.detail && <div className="alert alert-danger">{errors.detail}</div>}
              {errors.non_field_errors && (
                <div className="alert alert-danger">{errors.non_field_errors.join(', ')}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">{t('Username')}</label>
                    <input
                      type="text"
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      value={form.username}
                      onChange={update('username')}
                      required minLength={5} maxLength={20}
                    />
                    {errFor('username')}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">{t('Email')}</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={form.email}
                      onChange={update('email')}
                      required
                    />
                    {errFor('email')}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">{t('First name')}</label>
                    <input
                      type="text"
                      className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                      value={form.first_name}
                      onChange={update('first_name')}
                      required
                    />
                    {errFor('first_name')}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">{t('Last name')}</label>
                    <input
                      type="text"
                      className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                      value={form.last_name}
                      onChange={update('last_name')}
                      required
                    />
                    {errFor('last_name')}
                  </div>
                </div>

                <div className="mb-3">
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

                <div className="mb-3">
                  <label className="form-label">{t('Bio')}</label>
                  <textarea
                    className={`form-control ${errors.bio ? 'is-invalid' : ''}`}
                    rows="4"
                    value={form.bio}
                    onChange={update('bio')}
                  ></textarea>
                  {errFor('bio')}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">{t('Avatar')}</label>
                    <input
                      type="file"
                      className={`form-control ${errors.avatar ? 'is-invalid' : ''}`}
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      accept="image/*"
                    />
                    {errFor('avatar')}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label d-block">{t('Or choose a default avatar')}</label>
                    <DefaultAvatarPicker value={defaultAvatar} onChange={setDefaultAvatar} />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">{t('Password')}</label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      value={form.password}
                      onChange={update('password')}
                      required minLength={8}
                    />
                    {errFor('password')}
                  </div>
                  <div className="col-md-6 mb-4">
                    <label className="form-label">{t('Confirm password')}</label>
                    <input
                      type="password"
                      className={`form-control ${errors.password2 ? 'is-invalid' : ''}`}
                      value={form.password2}
                      onChange={update('password2')}
                      required minLength={8}
                    />
                    {errFor('password2')}
                  </div>
                </div>

                <button type="submit" className="btn btn-dark w-100 rounded-3" disabled={loading}>
                  {loading ? t('Creating account...') : t('Create Artisan Account')}
                </button>
              </form>

              <p className="text-center mt-4 mb-0">
                {t('Already have an account?')} <Link to="/login">{t('Login')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}