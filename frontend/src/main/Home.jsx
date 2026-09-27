import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import useReveal from '../hooks/useReveal'

const CATEGORY_ICONS = {
  Calligraphy: 'bi bi-pen-fill',
  Embroidery: 'bi bi-scissors',
  'Leather Goods': 'bi bi-bag-fill',
  Metalwork: 'bi bi-hammer',
  'Painting & Art': 'bi bi-palette-fill',
}

export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useReveal([data]) // re-run reveal when data arrives

  useEffect(() => {
    let cancelled = false
    api.get('/main/home/')
      .then((res) => { if (!cancelled) setData(res.data) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  const isArtisan = user?.is_artisan
  const isAuthed = !!user

  // ─────────────────────────────────────────────────────────
  // Hero buttons — different per role
  // ─────────────────────────────────────────────────────────
  const heroButtons = () => {
    if (isAuthed && isArtisan) {
      return (
        <>
          <Link to="/requests" className="btn btn-saaf-primary rounded-pill">
            {t('Browse Requests')}
          </Link>
          <Link to={`/workshop/${user.id}`} className="btn btn-saaf-outline rounded-pill">
            {t('My Workshop')}
          </Link>
        </>
      )
    }
    if (isAuthed) {
      return (
        <>
          <Link to="/requests/new" className="btn btn-saaf-primary rounded-pill">
            {t('Post a Request')}
          </Link>
          <Link to="/browse" className="btn btn-saaf-outline rounded-pill">
            {t('Browse Artisans')}
          </Link>
        </>
      )
    }
    return (
      <>
        <Link to="/register" className="btn btn-saaf-primary rounded-pill">
          {t('Get Started Free')}
        </Link>
        <Link to="/browse" className="btn btn-saaf-outline rounded-pill">
          {t('Browse Artisans')}
        </Link>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────
  // Hero title — split so we can highlight one word
  // ─────────────────────────────────────────────────────────
  const heroTitle = () => {
    if (isArtisan) {
      return (
        <>
          {t('Your next commission is')}{' '}
          <span className="saaf-text-accent">{t('waiting')}</span>.
        </>
      )
    }
    return (
      <>
        {t('Commission something made for you, by a real')}{' '}
        <span className="saaf-text-accent">{t('artisan')}</span>.
      </>
    )
  }

  const heroDescription = () => {
    if (isArtisan) {
      return t('Browse open requests from clients across Saudi Arabia, submit your proposal with a price and timeline, and get paid securely once delivery is confirmed.')
    }
    return t('Post your idea, receive proposals from skilled Saudi craftspeople, and track every step — from the first progress update to final delivery.')
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  const categories = data?.categories || []
  const feedType = data?.home_feed_type || 'top_artisans'
  const latestRequests = data?.latest_requests || []
  const topWorkshops = data?.top_rated_workshops || []

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="saaf-hero saaf-reveal">
        <video className="saaf-hero-video" autoPlay muted loop playsInline>
          <source src="/videos/6693574-uhd_2160_4096_25fps.mp4" type="video/mp4" />
        </video>
        <div className="saaf-hero-overlay"></div>
        <div className="container-lg saaf-hero-content-wrap">
          <div className="saaf-hero-text">
            <p className="saaf-eyebrow">{t('— The Saudi artisan marketplace')}</p>
            <h1 className="saaf-hero-title mb-4">{heroTitle()}</h1>
            <p className="saaf-description mb-4">{heroDescription()}</p>
            <div className="d-flex gap-3 flex-wrap">{heroButtons()}</div>
          </div>
        </div>
      </section>

      {/* ───────────── Categories ───────────── */}
      <section className="saaf-section py-5 saaf-reveal">
        <div className="container-lg">
          <p className="saaf-eyebrow text-center mb-2">{t('— Categories')}</p>
          <h2 className="saaf-section-title text-center mb-5">
            {t('Craft categories for custom work')}
          </h2>
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-6 g-3">
            {categories.map((cat) => (
              <div className="col" key={cat.id}>
                <Link to={`/browse?category=${cat.id}`} className="saaf-craft-card text-decoration-none">
                  <i className={`${CATEGORY_ICONS[cat.name] || 'bi bi-grid'} saaf-craft-icon`}></i>
                  <span className="saaf-craft-label">{cat.name}</span>
                </Link>
              </div>
            ))}
            <div className="col">
              <Link to="/browse" className="saaf-craft-card text-decoration-none">
                <i className="bi bi-grid saaf-craft-icon"></i>
                <span className="saaf-craft-label">{t('Browse all')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section className="saaf-section py-5 saaf-reveal">
        <div className="container-lg">
          <div className="saaf-how-works-box">
            <p className="saaf-eyebrow text-center mb-3">— {t('How Saaf Works')}</p>
            <div className="row row-cols-1 row-cols-md-3 g-4">
              {isArtisan ? (
                <>
                  <div className="col">
                    <div className="saaf-step">
                      <h3 className="saaf-step-number">1</h3>
                      <h5 className="mb-2">{t('Browse Requests')}</h5>
                      <p className="text-muted small">
                        {t('Explore open commission requests from clients. Filter by craft category, budget, and deadline.')}
                      </p>
                    </div>
                  </div>
                  <div className="col">
                    <div className="saaf-step">
                      <h3 className="saaf-step-number">2</h3>
                      <h5 className="mb-2">{t('Submit a Proposal')}</h5>
                      <p className="text-muted small">
                        {t('Send your price, timeline, and a message. Annotate reference images to show exactly what you can deliver.')}
                      </p>
                    </div>
                  </div>
                  <div className="col">
                    <div className="saaf-step">
                      <h3 className="saaf-step-number saaf-step-accent">3</h3>
                      <h5 className="mb-2">{t('Deliver & Get Paid')}</h5>
                      <p className="text-muted small">
                        {t('Post progress updates with photos as you work. Payment is released to you once the client confirms delivery.')}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="col">
                    <div className="saaf-step">
                      <h3 className="saaf-step-number">1</h3>
                      <h5 className="mb-2">{t('Post Your Request')}</h5>
                      <p className="text-muted small">
                        {t('Describe your custom piece, upload reference images, and set a budget — or leave it flexible.')}
                      </p>
                    </div>
                  </div>
                  <div className="col">
                    <div className="saaf-step">
                      <h3 className="saaf-step-number">2</h3>
                      <h5 className="mb-2">{t('Choose Your Artisan')}</h5>
                      <p className="text-muted small">
                        {t('Review proposals from skilled craftspeople. Compare prices and timelines, then accept the best fit.')}
                      </p>
                    </div>
                  </div>
                  <div className="col">
                    <div className="saaf-step">
                      <h3 className="saaf-step-number saaf-step-accent">3</h3>
                      <h5 className="mb-2">{t('Track & Confirm')}</h5>
                      <p className="text-muted small">
                        {t("Follow photo updates from your artisan, leave feedback, and confirm delivery. Payment releases only when you're satisfied.")}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Feed ───────────── */}
      <section className="saaf-section py-5 saaf-reveal">
        <div className="container-lg">
          {feedType === 'requests' ? (
            <>
              <p className="saaf-eyebrow text-center mb-2">{t('— Open commissions')}</p>
              <h2 className="saaf-section-title text-center mb-5">
                {t('Latest requests looking for an artisan')}
              </h2>
              {latestRequests.length > 0 ? (
                <div className="row g-4">
                  {latestRequests.map((r) => (
                    <div className="col-md-6 col-xl-3" key={r.id}>
                      <Link to={`/requests/${r.id}`} className="text-decoration-none">
                        <div className="saaf-featured-card h-100">
                          <div className="saaf-product-media">
                            {r.cover_image ? (
                              <img
                                src={r.cover_image}
                                alt={r.title}
                                className="img-fluid w-100 h-100"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <i className="bi bi-file-earmark-text"></i>
                            )}
                          </div>
                          <div className="saaf-product-body">
                            <h5 className="mb-2">
                              {r.title.length > 50 ? r.title.slice(0, 50) + '…' : r.title}
                            </h5>
                            <p className="text-muted small mb-2">
                              {r.description.length > 70 ? r.description.slice(0, 70) + '…' : r.description}
                            </p>
                            <p className="saaf-price-tag mb-0">{r.category_name}</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="saaf-featured-card text-center p-4">
                  <p className="mb-0 text-muted">{t('No recent requests yet.')}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="saaf-eyebrow text-center mb-2">{t('— Top rated artisans')}</p>
              <h2 className="saaf-section-title text-center mb-5">
                {t('Highest rated workshops on Saaf')}
              </h2>
              {topWorkshops.length > 0 ? (
                <div className="row g-4">
                  {topWorkshops.map((w) => (
                    <div className="col-md-6 col-xl-3" key={w.id}>
                      <Link to={`/workshop/${w.artisan_user_id}`} className="text-decoration-none">
                        <div className="saaf-featured-card h-100">
                          <div className="saaf-product-media">
                            {w.cover_image ? (
                              <img
                                src={w.cover_image}
                                alt={w.workshop_name}
                                className="img-fluid w-100 h-100"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <i className="bi bi-shop"></i>
                            )}
                          </div>
                          <div className="saaf-product-body">
                            <h5 className="mb-2">{w.workshop_name}</h5>
                            <p className="text-muted small mb-2">
                              {(w.tagline || t('Saudi artisan workshop')).slice(0, 70)}
                            </p>
                            <p className="saaf-price-tag mb-1">
                              {w.location || t('Saudi Arabia')}
                            </p>
                            <small className="text-muted">
                              ⭐ {(w.avg_rating || 0).toFixed(1)} / 5
                            </small>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="saaf-featured-card text-center p-4">
                  <p className="mb-0 text-muted">{t('No published workshops yet.')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ───────────── Artisan CTA (anonymous only) ───────────── */}
      {!isAuthed && (
        <section className="saaf-section py-5 saaf-reveal">
          <div className="container-lg">
            <div className="saaf-artisan-cta-banner">
              <div>
                <p className="saaf-eyebrow mb-1">{t('— For craftspeople')}</p>
                <h3 className="saaf-artisan-cta-title mb-2">
                  {t('Are you a Saudi craftsperson?')}
                </h3>
                <p className="text-muted mb-0">
                  {t('Showcase your craft on Saaf. Receive commission requests, set your own price and timeline, and get paid securely.')}
                </p>
              </div>
              <Link to="/register/artisan" className="btn btn-saaf-primary rounded-pill flex-shrink-0">
                {t('Join as an Artisan')}
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}