import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

const STATUS_PILL = {
  open: 'proposal-status-pill--accepted',
  in_review: 'proposal-status-pill--pending',
  closed: 'proposal-status-pill--in-progress',
  time_ended: 'proposal-status-pill--withdrawn',
}

const STATUS_LABEL = {
  open: 'Open',
  in_review: 'In Review',
  closed: 'Closed',
  time_ended: 'Time Ended',
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtBudget(r) {
  const max = r.budget_max ? parseFloat(r.budget_max) : null
  if (max === null) return null
  return `${max.toFixed(0)} SAR`
}

export default function MyRequests() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const page = searchParams.get('page') || '1'

  useEffect(() => {
    setLoading(true)
    api
      .get('/requests/', {
        params: { mine: 1, page, per_page: 10 },
      })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [page])

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams)
    if (p === 1) next.delete('page')
    else next.set('page', String(p))
    setSearchParams(next)
  }

  if (loading && !data) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{t('Unable to load your requests.')}</div>
      </div>
    )
  }

  const results = data.results || []
  const pagination = data.pagination || {
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    start_index: 0,
    end_index: 0,
    has_previous: false,
    has_next: false,
    previous_page: null,
    next_page: null,
  }

  return (
    <section className="request-shell">
      <div className="request-container">
        {/* Hero */}
        <header className="request-hero request-hero--row">
          <div>
            <p className="request-eyebrow">{t('Requester Dashboard')}</p>
            <h1 className="mb-2">{t('My Requests')}</h1>
            <p className="request-sub">{t('All the custom requests you have posted.')}</p>
          </div>
          <Link to="/requests/new" className="request-action request-hero-cta">
            + {t('Post a Request')}
          </Link>
        </header>

        {results.length > 0 ? (
          <>
            <div className="proposal-list">
              {results.map((r) => {
                const budget = fmtBudget(r)
                const pillClass = STATUS_PILL[r.status] || 'proposal-status-pill--withdrawn'
                const pillLabel = STATUS_LABEL[r.status] || r.status_display

                return (
                  <div key={r.id} className={`proposal-card proposal-card--req-${r.status}`}>
                    {/* Head */}
                    <div className="proposal-card-head">
                      <div>
                        <p className="proposal-card-request-title">
                          <Link to={`/requests/${r.id}`}>{r.title}</Link>
                        </p>
                        <p className="proposal-card-meta">
                          {r.category_name}
                          {r.deadline && (
                            <>
                              {' • '}
                              {t('Due')} {fmtDate(r.deadline)}
                            </>
                          )}
                        </p>
                      </div>
                      <span className={`proposal-status-pill ${pillClass}`}>
                        {pillLabel}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="proposal-card-body">
                      <div className="proposal-card-stat">
                        <span className="proposal-stat-label">{t('Budget')}</span>
                        <span className="proposal-stat-value">
                          {budget || t('Flexible')}
                        </span>
                      </div>
                      <div className="proposal-card-stat">
                        <span className="proposal-stat-label">{t('Proposals')}</span>
                        <span className="proposal-stat-value">{r.proposal_count}</span>
                      </div>
                      <div className="proposal-card-stat">
                        <span className="proposal-stat-label">{t('Posted')}</span>
                        <span className="proposal-stat-value">{fmtDate(r.created_at)}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {r.description && (
                      <p className="proposal-card-message">
                        {r.description.split(' ').slice(0, 30).join(' ')}
                        {r.description.split(' ').length > 30 ? '…' : ''}
                      </p>
                    )}

                    {/* Image gallery */}
                    {r.images && r.images.length > 0 && (
                      <div className="proposal-card-gallery">
                        {r.images.map((img, idx) =>
                          img.url ? (
                            <img
                              key={img.id}
                              src={img.url}
                              alt={`${t('Reference image')} ${idx + 1}`}
                              className="proposal-gallery-thumb"
                              title={img.caption}
                            />
                          ) : null
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="proposal-card-actions">
                      <Link to={`/requests/${r.id}`} className="proposal-action-btn">
                        <i className="bi bi-eye"></i> {t('View')}
                      </Link>
                      {r.can_edit && (
                        <Link to={`/requests/${r.id}/edit`} className="proposal-action-btn">
                          <i className="bi bi-pencil"></i> {t('Edit')}
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="pagination-wrap">
                <p className="saaf-page-status">
                  {t('Showing')} {pagination.start_index}–{pagination.end_index} {t('of')} {pagination.total_count}
                </p>
                <nav>
                  <ul className="pagination align-items-center flex-wrap gap-1 mb-0">
                    {/* First */}
                    <li className={`page-item ${!pagination.has_previous ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link saaf-page-link"
                        onClick={() => pagination.has_previous && goToPage(1)}
                        disabled={!pagination.has_previous}
                        title={t('First page')}
                      >
                        <i className="bi bi-chevron-double-left"></i>
                      </button>
                    </li>

                    {/* Previous */}
                    <li className={`page-item ${!pagination.has_previous ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link saaf-page-link"
                        onClick={() => pagination.has_previous && goToPage(pagination.previous_page)}
                        disabled={!pagination.has_previous}
                      >
                        <i className="bi bi-chevron-left me-1"></i> {t('Previous')}
                      </button>
                    </li>

                    {/* Page numbers (±2) */}
                    {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                      .filter((n) => Math.abs(n - pagination.current_page) <= 2)
                      .map((n) =>
                        n === pagination.current_page ? (
                          <li key={n} className="page-item active">
                            <span className="page-link saaf-page-link saaf-page-current">{n}</span>
                          </li>
                        ) : (
                          <li key={n} className="page-item">
                            <button
                              type="button"
                              className="page-link saaf-page-link"
                              onClick={() => goToPage(n)}
                            >
                              {n}
                            </button>
                          </li>
                        )
                      )}

                    {/* Total */}
                    <li className="page-item disabled">
                      <span className="page-link saaf-page-link saaf-page-status">
                        {t('of')} {pagination.total_pages}
                      </span>
                    </li>

                    {/* Next */}
                    <li className={`page-item ${!pagination.has_next ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link saaf-page-link"
                        onClick={() => pagination.has_next && goToPage(pagination.next_page)}
                        disabled={!pagination.has_next}
                      >
                        {t('Next')} <i className="bi bi-chevron-right ms-1"></i>
                      </button>
                    </li>

                    {/* Last */}
                    <li className={`page-item ${!pagination.has_next ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link saaf-page-link"
                        onClick={() => pagination.has_next && goToPage(pagination.total_pages)}
                        disabled={!pagination.has_next}
                        title={t('Last page')}
                      >
                        <i className="bi bi-chevron-double-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="request-detail-card page-empty-state">
            <i className="bi bi-file-text page-empty-state-icon"></i>
            <p className="page-empty-state-text">
              {t('You have not posted any requests yet.')}
            </p>
            <Link to="/requests/new" className="request-action">
              {t('Post a Request')}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}