import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

export default function Browse() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Read filters from URL (source of truth)
  const filters = {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    sort: searchParams.get('sort') || 'newest',
    use_rating: searchParams.get('use_rating') === '1',
    verified: searchParams.get('verified') === '1',
    rating_min: parseFloat(searchParams.get('rating_min') || '1'),
    rating_max: parseFloat(searchParams.get('rating_max') || '5'),
    page: searchParams.get('page') || '1',
  }

  useEffect(() => {
    setLoading(true)
    api
      .get('/main/browse/', { params: Object.fromEntries(searchParams) })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [searchParams])

  // Apply a filter change (resets page to 1)
  const applyFilter = (updates) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined || v === false) next.delete(k)
      else if (v === true) next.set(k, '1')
      else next.set(k, String(v))
    })
    if (!('page' in updates)) next.delete('page')
    setSearchParams(next)
  }

  const resetFilters = () => setSearchParams({})

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(p))
    setSearchParams(next)
  }

  if (loading && !data) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  const artisans = data?.artisans || []
  const categories = data?.categories || []
  const cities = data?.cities || []
  const pagination = data?.pagination || { current_page: 1, total_pages: 1, total_count: 0 }

  // For the "apply" button in search input
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    applyFilter({ q: fd.get('q') })
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="browse-hero py-5">
        <div className="container-fluid px-0">
          <div className="text-center mx-auto browse-hero-content">
            <h1 className="fw-bold mb-3">{t('Browse Artisans')}</h1>
            <p className="text-muted mb-0">
              {t('Discover Saudi artisans, compare workshops, and narrow your search by category, city, and average rating.')}
            </p>
          </div>
        </div>
      </section>

      <section className="pb-5">
        <div className="container">
          <div className="row g-4 align-items-start">
            {/* ── Filter panel ── */}
            <div className="col-12 col-xl-3">
              <div className="filter-panel card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h5 className="fw-bold mb-1">{t('Filter results')}</h5>
                      <p className="text-muted small mb-0">{t('Refine artisans quickly')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="btn btn-sm btn-saaf-outline rounded-pill"
                    >
                      {t('Reset')}
                    </button>
                  </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="mb-4">
                <label className="form-label fw-semibold">{t('Search')}</label>
                <div className="search-input-wrap position-relative">
                    <i className="bi bi-search search-input-icon"></i>
                    <input
                    type="text"
                    name="q"
                    defaultValue={filters.q}
                    className="form-control rounded-3 ps-5 pe-5"
                    placeholder={t('Workshop, artisan, service...')}
                    />
                    <button
                    type="submit"
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-3 text-decoration-none text-saaf-accent"
                    style={{ zIndex: 5 }}
                    aria-label={t('Search')}
                    title={t('Search')}
                    >
                    <i className="bi bi-arrow-right-circle-fill" style={{ fontSize: '1.4rem' }}></i>
                    </button>
                </div>
                </form>

                  {/* Category */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">{t('Category')}</label>
                    <select
                      className="form-select rounded-3"
                      value={filters.category}
                      onChange={(e) => applyFilter({ category: e.target.value })}
                    >
                      <option value="">{t('All categories')}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">{t('City')}</label>
                    <select
                      className="form-select rounded-3"
                      value={filters.city}
                      onChange={(e) => applyFilter({ city: e.target.value })}
                    >
                      <option value="">{t('All cities')}</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Verified */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold d-block mb-2">
                      {t('Verification')}
                    </label>
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="verified"
                        checked={filters.verified}
                        onChange={(e) => applyFilter({ verified: e.target.checked })}
                      />
                      <label className="form-check-label fw-medium" htmlFor="verified">
                        {t('Show verified artisans only')}
                      </label>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold d-block mb-3">
                      {t('Average rating')}
                    </label>
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="use_rating"
                        checked={filters.use_rating}
                        onChange={(e) => applyFilter({ use_rating: e.target.checked })}
                      />
                      <label className="form-check-label fw-medium" htmlFor="use_rating">
                        {t('Use average rating filter')}
                      </label>
                    </div>

                    <RatingSlider
                      min={filters.rating_min}
                      max={filters.rating_max}
                      disabled={!filters.use_rating}
                      onCommit={(newMin, newMax) =>
                        applyFilter({ rating_min: newMin, rating_max: newMax })
                      }
                    />
                  </div>

                  {/* Sort */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">{t('Sort by')}</label>
                    <select
                      className="form-select rounded-3"
                      value={filters.sort}
                      onChange={(e) => applyFilter({ sort: e.target.value })}
                    >
                      <option value="newest">{t('Newest')}</option>
                      <option value="oldest">{t('Oldest')}</option>
                      <option value="name_az">{t('Name A-Z')}</option>
                      <option value="name_za">{t('Name Z-A')}</option>
                      <option value="workshop_az">{t('Workshop A-Z')}</option>
                      <option value="workshop_za">{t('Workshop Z-A')}</option>
                      <option value="city_az">{t('City A-Z')}</option>
                      <option value="city_za">{t('City Z-A')}</option>
                      <option value="rating_high">{t('Highest Rated')}</option>
                      <option value="rating_low">{t('Lowest Rated')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Results ── */}
            <div className="col-12 col-xl-9">
              {artisans.length > 0 ? (
                <>
                  <div className="results-toolbar card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body p-3 p-lg-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div>
                        <h5 className="fw-bold mb-1">{t('Available artisans')}</h5>
                        <p className="text-muted mb-0">
                          {pagination.total_count} {pagination.total_count === 1 ? t('result') : t('results')}
                        </p>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {filters.category && (
                          <span className="badge rounded-pill active-filter-chip px-3 py-2">
                            {t('Category selected')}
                          </span>
                        )}
                        {filters.city && (
                          <span className="badge rounded-pill active-filter-chip px-3 py-2">
                            {filters.city}
                          </span>
                        )}
                        {filters.verified && (
                          <span className="badge rounded-pill active-filter-chip px-3 py-2">
                            {t('Verified only')}
                          </span>
                        )}
                        {filters.q && (
                          <span className="badge rounded-pill active-filter-chip px-3 py-2">
                            "{filters.q}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row g-4 row-cols-1 row-cols-md-2 row-cols-xxl-3">
                    {artisans.map((a) => (
                      <div className="col" key={a.id}>
                        <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden artisan-card">
                          <div className="card-body p-4 d-flex flex-column">
                            <div className="d-flex align-items-start gap-3 mb-3">
                              {a.avatar ? (
                                <div className="artisan-avatar-wrap rounded-circle border shadow-sm flex-shrink-0">
                                  <img
                                    src={a.avatar}
                                    alt={a.username}
                                    className="artisan-avatar-img"
                                  />
                                </div>
                              ) : (
                                <div className="artisan-avatar-wrap rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm flex-shrink-0 artisan-avatar-fallback">
                                  {a.username.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="flex-grow-1">
                                <h5 className="fw-bold mb-1">{a.display_name}</h5>
                                <p className="text-muted small mb-2">@{a.username}</p>
                                <div className="d-flex flex-wrap gap-2">
                                  <span className="badge rounded-pill active-filter-chip px-3 py-2">
                                    <i className="bi bi-geo-alt me-1"></i>
                                    {a.location || t('Saudi Arabia')}
                                  </span>
                                  {a.is_verified && (
                                    <span className="badge rounded-pill bg-success px-3 py-2">
                                      {t('Verified')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mb-3">
                              {a.workshop_name && (
                                <p className="fw-semibold mb-2 artisan-workshop-name">
                                  {a.workshop_name}
                                </p>
                              )}

                              {a.avg_rating ? (
                                <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill artisan-rating-badge small fw-semibold mb-2">
                                  <i className="bi bi-star-fill"></i>
                                  {a.avg_rating.toFixed(1)} / 5
                                </div>
                              ) : (
                                <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-light text-muted small fw-semibold mb-2">
                                  <i className="bi bi-star"></i>
                                  {t('No ratings yet')}
                                </div>
                              )}
                            </div>

                            {a.tagline ? (
                              <p className="text-muted small mb-3">
                                {a.tagline.length > 100 ? a.tagline.slice(0, 100) + '…' : a.tagline}
                              </p>
                            ) : a.bio ? (
                              <p className="text-muted small mb-3">
                                {a.bio.length > 100 ? a.bio.slice(0, 100) + '…' : a.bio}
                              </p>
                            ) : (
                              <p className="text-muted small mb-3">{t('No bio added yet.')}</p>
                            )}

                            {a.categories.length > 0 && (
                              <div className="d-flex flex-wrap gap-2 mb-4">
                                {a.categories.map((c) => (
                                  <span
                                    key={c.id}
                                    className="badge rounded-pill category-chip px-3 py-2"
                                  >
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-auto d-grid">
                              <Link
                                to={`/workshop/${a.id}`}
                                className="btn btn-saaf-outline rounded-pill"
                              >
                                {t('View Workshop')}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Pagination ── */}
                  {pagination.total_pages > 1 && (
                    <nav className="pagination-wrap mt-5">
                      <ul className="pagination justify-content-center align-items-center flex-wrap gap-2 mb-0">
                        <li className={`page-item ${!pagination.has_previous ? 'disabled' : ''}`}>
                          <button
                            className="page-link saaf-page-link"
                            onClick={() => pagination.has_previous && goToPage(1)}
                            disabled={!pagination.has_previous}
                          >
                            <i className="bi bi-chevron-double-left me-1"></i> {t('First')}
                          </button>
                        </li>
                        <li className={`page-item ${!pagination.has_previous ? 'disabled' : ''}`}>
                          <button
                            className="page-link saaf-page-link"
                            onClick={() =>
                              pagination.has_previous && goToPage(pagination.previous_page)
                            }
                            disabled={!pagination.has_previous}
                          >
                            <i className="bi bi-chevron-left me-1"></i> {t('Previous')}
                          </button>
                        </li>

                        <li className="page-item active">
                          <span className="page-link saaf-page-link saaf-page-current">
                            {pagination.current_page}
                          </span>
                        </li>

                        <li className="page-item disabled d-none d-md-block">
                          <span className="page-link saaf-page-link saaf-page-status">
                            {t('of')} {pagination.total_pages}
                          </span>
                        </li>

                        <li className={`page-item ${!pagination.has_next ? 'disabled' : ''}`}>
                          <button
                            className="page-link saaf-page-link"
                            onClick={() => pagination.has_next && goToPage(pagination.next_page)}
                            disabled={!pagination.has_next}
                          >
                            {t('Next')} <i className="bi bi-chevron-right ms-1"></i>
                          </button>
                        </li>
                        <li className={`page-item ${!pagination.has_next ? 'disabled' : ''}`}>
                          <button
                            className="page-link saaf-page-link"
                            onClick={() => pagination.has_next && goToPage(pagination.total_pages)}
                            disabled={!pagination.has_next}
                          >
                            {t('Last')} <i className="bi bi-chevron-double-right ms-1"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </>
              ) : (
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body text-center py-5 px-4">
                    <div className="mb-3">
                      <i className="bi bi-search text-muted" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h4 className="fw-bold mb-2">{t('No artisans found')}</h4>
                    <p className="text-muted mb-3">
                      {t('Try changing your search keywords, city, category, or rating range.')}
                    </p>
                    <button
                      className="btn btn-saaf-outline rounded-pill px-4"
                      onClick={resetFilters}
                    >
                      {t('Clear filters')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Rating Slider sub-component
// ─────────────────────────────────────────────────────────
function RatingSlider({ min, max, disabled, onCommit }) {
  const { t } = useTranslation()
  const [localMin, setLocalMin] = useState(min)
  const [localMax, setLocalMax] = useState(max)

  useEffect(() => setLocalMin(min), [min])
  useEffect(() => setLocalMax(max), [max])

  const rangeMin = 1
  const rangeMax = 5
  const step = 0.5

  const left = ((localMin - rangeMin) / (rangeMax - rangeMin)) * 100
  const right = ((localMax - rangeMin) / (rangeMax - rangeMin)) * 100

  const handleMinChange = (e) => {
    const v = parseFloat(e.target.value)
    const next = Math.min(v, localMax)
    setLocalMin(next)
  }

  const handleMaxChange = (e) => {
    const v = parseFloat(e.target.value)
    const next = Math.max(v, localMin)
    setLocalMax(next)
  }

  const commit = () => {
    onCommit(localMin, localMax)
  }

  return (
    <div className={`rating-slider-card ${disabled ? 'rating-disabled' : ''}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted small">{t('From')}</span>
        <span className="text-muted small">{t('To')}</span>
      </div>

      <div className="range-slider-wrap">
        <div className="range-track"></div>
        <div
          className="range-fill"
          style={{ left: `${left}%`, right: `${100 - right}%` }}
        ></div>

        <input
          type="range"
          min={rangeMin}
          max={rangeMax}
          step={step}
          value={localMin}
          disabled={disabled}
          className="range-input"
          onChange={handleMinChange}
          onMouseUp={commit}
          onTouchEnd={commit}
        />
        <input
          type="range"
          min={rangeMin}
          max={rangeMax}
          step={step}
          value={localMax}
          disabled={disabled}
          className="range-input"
          onChange={handleMaxChange}
          onMouseUp={commit}
          onTouchEnd={commit}
        />
      </div>

      <div className="d-flex justify-content-between mt-3 rating-bubbles">
        <span className="rating-value-pill">{localMin.toFixed(1)}</span>
        <span className="rating-value-pill">{localMax.toFixed(1)}</span>
      </div>

      <div className="d-flex justify-content-between mt-3">
        <div className="rating-input-box">{localMin.toFixed(1)}</div>
        <div className="rating-input-box">{localMax.toFixed(1)}</div>
      </div>
    </div>
  )
}