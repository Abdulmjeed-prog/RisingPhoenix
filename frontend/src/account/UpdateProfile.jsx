import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function UpdateProfile() {
  const { t } = useTranslation()
  const { username } = useParams()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    bio: '',
  })
  const [phone, setPhone] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const isArtisan = user?.is_artisan

  // Guard: only the owner can edit
  useEffect(() => {
    if (!user) return
    if (username && username !== user.username) {
      navigate('/')
      return
    }

    // Prefill form from current user
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      email: user.email || '',
      bio: user.profile?.bio || '',
    })
    setPhone(user.profile?.phone || '')
    setAvatarPreview(user.profile?.avatar || null)
  }, [user, username, navigate])

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleFile = (e) => {
    const file = e.target.files?.[0] || null
    setAvatarFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setAvatarPreview(url)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    // Use FormData because we may include a file
    const fd = new FormData()
    fd.append('first_name', form.first_name)
    fd.append('last_name', form.last_name)
    fd.append('username', form.username)
    fd.append('email', form.email)
    fd.append('bio', form.bio)
    if (phone) fd.append('phone', phone)
    if (avatarFile) fd.append('avatar', avatarFile)

    try {
        await api.patch(`/auth/update-profile/${user.username}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      // Refresh the user so the navbar/sidebar reflect new data
      await refreshUser()

      // Redirect back to profile
      const profilePath = isArtisan
        ? `/artisan_profile/${form.username}`
        : `/profile/${form.username}`
      navigate(profilePath)
    } catch (err) {
      setErrors(err.response?.data || { detail: 'Update failed.' })
    } finally {
      setLoading(false)
    }
  }

  const errFor = (field) => errors[field] && (
    <div className="invalid-feedback d-block">
      {Array.isArray(errors[field]) ? errors[field].join(', ') : errors[field]}
    </div>
  )

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  const backPath = isArtisan
    ? `/artisan_profile/${user.username}`
    : `/profile/${user.username}`

  return (
    <section className="py-4 py-md-5">
      <div className="container-lg">
        <div className="saaf-dashboard-card rounded-4 p-4 p-md-5">
          <p className="saaf-eyebrow mb-2">
            {isArtisan ? t('Artisan Profile') : t('Profile')}
          </p>
          <h1 className="saaf-section-title mb-4">
            {isArtisan ? t('Update Artisan Profile') : t('Update Profile')}
          </h1>

          {errors.detail && <div className="alert alert-danger">{errors.detail}</div>}
          {errors.non_field_errors && (
            <div className="alert alert-danger">{errors.non_field_errors.join(', ')}</div>
          )}

          <form onSubmit={handleSubmit} className="row g-3">
            {/* First name */}
            <div className="col-md-6">
              <label htmlFor="first_name" className="form-label">{t('First Name')}</label>
              <input
                type="text"
                id="first_name"
                className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                value={form.first_name}
                onChange={update('first_name')}
              />
              {errFor('first_name')}
            </div>

            {/* Last name */}
            <div className="col-md-6">
              <label htmlFor="last_name" className="form-label">{t('Last Name')}</label>
              <input
                type="text"
                id="last_name"
                className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                value={form.last_name}
                onChange={update('last_name')}
              />
              {errFor('last_name')}
            </div>

            {/* Username */}
            <div className="col-md-6">
              <label htmlFor="username" className="form-label">{t('Username')}</label>
              <input
                type="text"
                id="username"
                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                value={form.username}
                onChange={update('username')}
                minLength={5}
                maxLength={20}
                required
              />
              {errFor('username')}
            </div>

            {/* Email */}
            <div className="col-md-6">
              <label htmlFor="email" className="form-label">{t('Email')}</label>
              <input
                type="email"
                id="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                value={form.email}
                onChange={update('email')}
                required
              />
              {errFor('email')}
            </div>

            {/* Phone */}
            <div className="col-md-6">
              <label className="form-label">{t('Phone')}</label>
              <PhoneInput
                defaultCountry="sa"
                value={phone}
                onChange={setPhone}
                inputClassName={`form-control ${errors.phone ? 'is-invalid' : ''}`}
              />
              <div className="form-text">
                {t('Changing your phone number will require re-verification.')}
              </div>
              {errFor('phone')}
            </div>

            {/* Avatar */}
            <div className="col-md-6">
              <label htmlFor="avatar" className="form-label">{t('Avatar')}</label>
              <div className="d-flex align-items-center gap-3">
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt="avatar preview"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--saaf-border)',
                    }}
                  />
                )}
                <input
                  type="file"
                  id="avatar"
                  className={`form-control ${errors.avatar ? 'is-invalid' : ''}`}
                  accept="image/*"
                  onChange={handleFile}
                />
              </div>
              {errFor('avatar')}
            </div>

            {/* Bio */}
            <div className="col-12">
              <label htmlFor="bio" className="form-label">{t('Bio')}</label>
              <textarea
                id="bio"
                className={`form-control ${errors.bio ? 'is-invalid' : ''}`}
                rows="4"
                value={form.bio}
                onChange={update('bio')}
              ></textarea>
              {errFor('bio')}
            </div>

            {/* Actions */}
            <div className="col-12 d-flex flex-wrap gap-2">
              <button type="submit" className="btn btn-saaf-primary rounded-pill" disabled={loading}>
                {loading ? t('Saving...') : t('Save Changes')}
              </button>
              <Link to={backPath} className="btn btn-saaf-outline rounded-pill">
                {t('Back to Profile')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}