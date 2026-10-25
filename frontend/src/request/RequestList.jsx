import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const STATUS_BADGE = {
  open: 'text-bg-success',
  in_review: 'text-bg-warning',
  time_ended: 'text-bg-secondary',
  closed: 'text-bg-dark',
}

export default function RequestList() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const filters = {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
    sort: searchParams.get('sort') || 'newest',
    mine: searchParams.get('mine') || '',
    page: searchParams.get('page') || '1',
  }

  useEffect(() => {
    setLoading(true)
    api
      .get('/requests/', { params: Object.fromEntries(searchParams) })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [searchParams, user])

  const applyFilter = (updates) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k)
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

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    applyFilter({ q: fd.get('q') || '' })
  }

  const toggleMine = () => {
    applyFilter({ mine: filters.mine === '1' ? '' : '1' })
  }

  if (loading && !data) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  const results = data?.results || []
  const pagination = data?.pagination || { current_page: 1, total_pages: 1, total_count: 0 }
  const categories = data?.categories || []
  const statusChoices = data?.status_choices || []

  return (
    <>
      {/* Hero */}
      <section className="browse-hero py-5">
        <div className="container-fluid px-0">
          <div className="text-center mx-auto browse-hero-content">
            <h1 className="fw-bold mb-3">{t('Browse Requests')}</h1>
            <p className="text-muted mb-0">
              {t('Find project requests that match your craft and filter results quickly.')}
            </p>
          </div>
        </div>
      </section>

      <section className="pb-5">
        <div className="container">
          <div className="row g-4 align-items-start">
            {/* Filter panel */}
            <div className="col-12 col-xl-3">
              <div className="filter-panel card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h5 className="fw-bold mb-1">{t('Filter requests')}</h5>
                      <p className="text-muted small mb-0">{t('Refine results fast')}</p>
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
                        placeholder={t('Title, description, requester')}
                      />
                      <button
                        type="submit"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-3 text-decoration-none"
                        style={{ zIndex: 5 }}
                        aria-label={t('Search')}
                      >
                        <i className="bi bi-arrow-right-circle-fill" style={{ fontSize: '1.2rem' }}></i>
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
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">{t('Status')}</label>
                    <select
                      className="form-select rounded-3"
                      value={filters.status}
                      onChange={(e) => applyFilter({ status: e.target.value })}
                    >
                      <option value="">{t('All statuses')}</option>
                      {statusChoices.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">{t('Sort by')}</label>
                    <select
                      className="form-select rounded-3"
                      value={filters.sort}
                      onChange={(e) => applyFilter({ sort: e.target.value })}
                    >
                      <option value="newest">{t('Newest first')}</option>
                      <option value="oldest">{t('Oldest first')}</option>
                      <option value="deadline_soon">{t('Deadline soonest')}</option>
                      <option value="budget_high">{t('Highest budget')}</option>
                      <option value="budget_low">{t('Lowest budget')}</option>
                    </select>
                  </div>

                  {/* Mine toggle */}
                  {user && (
                    <div className="d-grid">
                      <button
                        type="button"
                        onClick={toggleMine}
                        className="btn btn-saaf-outline rounded-pill py-2"
                      >
                        {filters.mine === '1' ? t('Show All Requests') : t('My Requests')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="col-12 col-xl-9">
              <div className="results-toolbar card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3 p-lg-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h5 className="fw-bold mb-1">{t('Available requests')}</h5>
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
                    {filters.status && (
                      <span className="badge rounded-pill active-filter-chip px-3 py-2">
                        {filters.status}
                      </span>
                    )}
                    {filters.q && (
                      <span className="badge rounded-pill active-filter-chip px-3 py-2">
                        “{filters.q}”
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {results.length > 0 ? (
                <div className="row g-4 row-cols-1 row-cols-md-2 row-cols-xxl-3">
                  {results.map((r) => (
                    <div className="col" key={r.id}>
                      <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden artisan-card">
                        {r.cover_image ? (
                          <img
                            src={r.cover_image}
                            alt={r.title}
                            className="w-100"
                            style={{ height: 200, objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="request-card-placeholder">
                            <i className="bi bi-box-seam request-card-placeholder-icon"></i>
                            <span className="request-card-placeholder-label">{r.category_name}</span>
                          </div>
                        )}

                        <div className="card-body p-4 d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <span className="badge rounded-pill active-filter-chip px-3 py-2">
                              {r.category_name}
                            </span>
                            <span className={`badge rounded-pill ${STATUS_BADGE[r.status] || 'text-bg-dark'}`}>
                              {r.status_display}
                            </span>
                          </div>

                          <h5 className="fw-bold mb-2">
                            {r.title.length > 60 ? r.title.slice(0, 60) + '…' : r.title}
                          </h5>
                          <p className="text-muted small mb-2">{t('by')} {r.requester_username}</p>
                          <p className="text-muted small mb-3">
                            {r.description.length > 100
                              ? r.description.slice(0, 100).split(' ').slice(0, 16).join(' ') + '…'
                              : r.description}
                          </p>

                          <div className="d-flex justify-content-between align-items-center small text-muted mb-3">
                            <span>
                              {r.budget_max
                                ? `${parseFloat(r.budget_max).toFixed(0)} SAR`
                                : t('Budget flexible')}
                            </span>
                            <span>
                              {r.proposal_count} {r.proposal_count === 1 ? t('proposal') : t('proposals')}
                            </span>
                          </div>

                          <div className="mt-auto d-grid gap-2">
                            {r.can_edit && (
                              <Link
                                to={`/requests/${r.id}/edit`}
                                className="btn btn-saaf-outline rounded-pill"
                              >
                                {t('Edit Request')}
                              </Link>
                            )}
                            <Link
                              to={`/requests/${r.id}`}
                              className="btn btn-saaf-primary rounded-pill"
                            >
                              {t('View Details')}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body text-center py-5 px-4">
                    <div className="mb-3">
                      <i className="bi bi-search text-muted" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h4 className="fw-bold mb-2">{t('No requests found')}</h4>
                    <p className="text-muted mb-3">
                      {t('Try changing your search terms or filters.')}
                    </p>
                    <button
                      type="button"
                      className="btn btn-saaf-outline rounded-pill px-4"
                      onClick={resetFilters}
                    >
                      {t('Clear filters')}
                    </button>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="pagination-wrap mt-4">
                  <p className="saaf-page-status">
                    {t('Showing')} {pagination.start_index}–{pagination.end_index} {t('of')} {pagination.total_count}
                  </p>
                  <nav>
                    <ul className="pagination align-items-center flex-wrap gap-1 mb-0">
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
                          onClick={() => pagination.has_previous && goToPage(pagination.previous_page)}
                          disabled={!pagination.has_previous}
                        >
                          <i className="bi bi-chevron-left me-1"></i> {t('Previous')}
                        </button>
                      </li>

                      {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                        .filter((num) => Math.abs(num - pagination.current_page) <= 2)
                        .map((num) =>
                          num === pagination.current_page ? (
                            <li key={num} className="page-item active">
                              <span className="page-link saaf-page-link saaf-page-current">{num}</span>
                            </li>
                          ) : (
                            <li key={num} className="page-item">
                              <button className="page-link saaf-page-link" onClick={() => goToPage(num)}>
                                {num}
                              </button>
                            </li>
                          )
                        )}

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
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}