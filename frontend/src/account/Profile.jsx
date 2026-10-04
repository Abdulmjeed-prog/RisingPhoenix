import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Profile() {
  const { t } = useTranslation()
  const { username } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .get(`/auth/profile/${username}/`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Profile not found.'))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error || t('Profile not found.')}</div>
      </div>
    )
  }

  const isArtisan = data.is_artisan
  const isStaff = data.is_staff
  const isOwn = data.is_own_profile
  const profile = data.profile || {}

  // Avatar fallback = first letter of username
  const avatarFallback = (data.username || '?').charAt(0).toUpperCase()

  // Rating display: "4.5" or "No ratings yet"
  const ratingDisplay = data.avg_rating != null ? data.avg_rating : t('No ratings yet')

  return (
    <section className="py-4 py-md-5 saaf-profile-page">
      <div className="container-lg">
        <div className="saaf-dashboard-card saaf-profile-shell rounded-4 p-3 p-md-4 p-lg-5">
          <div className="saaf-profile-hero">
            <p className="saaf-eyebrow mb-2">
              {isStaff ? t('Staff Profile') : isArtisan ? t('Artisan Profile') : t('Profile')}
            </p>

            <div className="saaf-profile-hero-main">
              <div className="saaf-profile-avatar-wrap">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={data.username}
                    className="saaf-avatar-preview saaf-profile-avatar"
                  />
                ) : (
                  <div className="saaf-avatar-fallback saaf-profile-avatar">
                    {avatarFallback}
                  </div>
                )}
              </div>

              <div className="saaf-profile-heading-block">
                <h1 className="saaf-section-title mb-2">
                  {(data.first_name || data.last_name)
                    ? `${data.first_name} ${data.last_name}`.trim()
                    : data.username}
                </h1>
                <p className="saaf-profile-username mb-1">@{data.username}</p>
                <p className="saaf-profile-joined mb-0">
                  {t('Joined')} {fmtDate(data.date_joined)}
                </p>
              </div>

              <div className="saaf-profile-status-list">
                <span className="saaf-profile-pill">
                  <i className="bi bi-star-fill"></i> {ratingDisplay}
                </span>

                <span className={`saaf-profile-pill ${profile.is_phone_verified ? 'saaf-profile-pill--ok' : ''}`}>
                  <i className={`bi ${profile.is_phone_verified ? 'bi-patch-check-fill' : 'bi-patch-exclamation'}`}></i>{' '}
                  {profile.is_phone_verified ? t('Phone Verified') : t('Phone Not Verified')}
                </span>

                {isArtisan && (
                  <span className={`saaf-profile-pill ${profile.is_verified ? 'saaf-profile-pill--ok' : ''}`}>
                    <i className={`bi ${profile.is_verified ? 'bi-patch-check-fill' : 'bi-hourglass-split'}`}></i>{' '}
                    {profile.is_verified ? t('Verified Artisan') : t('Verification Pending')}
                  </span>
                )}

                {isArtisan && profile.is_featured && (
                  <span className="saaf-profile-pill">
                    <i className="bi bi-award-fill"></i> {t('Featured Artisan')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="row g-3 g-md-4 mt-1">
            <div className="col-sm-6 col-lg-3">
              <div className="saaf-info-card saaf-profile-info-card h-100">
                <span className="saaf-info-label">{t('Email')}</span>
                <p className="mb-0">{data.email || t('Not provided')}</p>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="saaf-info-card saaf-profile-info-card h-100">
                <span className="saaf-info-label">{t('Phone')}</span>
                <p className="mb-0">{profile.phone || t('Not provided')}</p>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="saaf-info-card saaf-profile-info-card h-100">
                <span className="saaf-info-label">{t('Average Rating')}</span>
                <p className="mb-0">{ratingDisplay}</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="saaf-profile-bio-card mt-4">
            <h2 className="saaf-profile-subtitle mb-2">{t('About')}</h2>
            <p className="mb-0">{profile.bio || t('No bio added yet.')}</p>
          </div>

          {/* Actions */}
          <div className="d-flex flex-wrap gap-2 mt-4 pt-1">
            {isOwn && !isStaff && (
              <Link
                to={isArtisan
                ? `/artisan_profile/${data.username}/update`
                : `/profile/${data.username}/update`}
                className="btn btn-saaf-primary rounded-pill d-inline-flex align-items-center gap-2"
              >
                <i className="bi bi-pencil-square"></i> {t('Edit Profile')}
              </Link>
            )}

            {isOwn && !isArtisan && !isStaff && (
              <>
                <Link
                  to="/my-cards"
                  className="btn btn-saaf-outline rounded-pill d-inline-flex align-items-center gap-2"
                >
                  <i className="bi bi-credit-card-2-front"></i> {t('My Cards')}
                </Link>

                {profile.phone && !profile.is_phone_verified && (
                  <Link
                    to={`/profile/${data.username}/verify-phone`}
                    className="btn btn-saaf-outline rounded-pill d-inline-flex align-items-center gap-2"
                  >
                    <i className="bi bi-patch-check"></i> {t('Verify Phone')}
                  </Link>
                )}
              </>
            )}

            <Link
              to={isStaff ? '/staff' : '/dashboard'}
              className="btn btn-saaf-outline rounded-pill d-inline-flex align-items-center gap-2"
            >
              <i className="bi bi-arrow-left"></i> {t('Back to Dashboard')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}