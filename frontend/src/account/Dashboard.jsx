import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function formatMonthYear(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const statusFilter = searchParams.get('request_status') || 'all'

  useEffect(() => {
    setLoading(true)
    api
      .get('/main/dashboard/', { params: { request_status: statusFilter } })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const handleStatusChange = (e) => {
    const val = e.target.value
    if (val === 'all') setSearchParams({})
    else setSearchParams({ request_status: val })
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  const isArtisan = data?.is_artisan
  const isStaff = data?.is_staff
  const isRequester = data?.is_requester

  return (
    <section className="py-4 py-md-5 saaf-dashboard-shell">
      <div className="container-lg">
        {/* ───────── Hero ───────── */}
        <div className="saaf-dashboard-card saaf-dashboard-hero saaf-dashboard-hero--split rounded-4 p-4 p-md-5 mb-4">
          <div className="saaf-dashboard-hero-grid">
            <div>
              <div className="saaf-dashboard-kicker-row">
                <p className="saaf-eyebrow mb-0">{t('Dashboard')}</p>
                {isStaff ? (
                  <span className="saaf-hero-chip">
                    <i className="bi bi-shield-check"></i> {t('Staff Access')}
                  </span>
                ) : isArtisan ? (
                  <span className="saaf-hero-chip">
                    <i className="bi bi-stars"></i> {t('Artisan Account')}
                  </span>
                ) : (
                  <span className="saaf-hero-chip">
                    <i className="bi bi-person-badge"></i> {t('Requester Account')}
                  </span>
                )}
              </div>

              <h1 className="saaf-section-title mb-2">
                {t('Welcome')}, {data?.first_name || data?.username}
              </h1>
              <p className="text-muted mb-0">
                {t('A cleaner control center for your next steps, account shortcuts, and marketplace activity.')}
              </p>

              <div className="saaf-dashboard-hero-actions">
                {isArtisan ? (
                  <>
                    <Link to="/requests" className="saaf-quick-action-btn">
                      <i className="bi bi-lightning-charge"></i> {t('Find New Request')}
                    </Link>
                    <Link to="/proposals" className="saaf-quick-action-btn">
                      <i className="bi bi-send-check"></i> {t('Track Proposals')}
                    </Link>
                    <Link to="/portfolio/upload" className="saaf-quick-action-btn saaf-quick-action-btn--soft">
                      <i className="bi bi-images"></i> {t('Refresh Portfolio')}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/requests/new" className="saaf-quick-action-btn">
                      <i className="bi bi-plus-circle"></i> {t('Create Request')}
                    </Link>
                    <Link to="/browse" className="saaf-quick-action-btn">
                      <i className="bi bi-search"></i> {t('Browse Artisans')}
                    </Link>
                    {isStaff && (
                      <Link to="/staff" className="saaf-quick-action-btn saaf-quick-action-btn--soft">
                        <i className="bi bi-kanban"></i> {t('Open Staff Tools')}
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="saaf-dashboard-side-panel">
              <div className="saaf-dashboard-side-card">
                <span className="saaf-info-label">{t('Account Focus')}</span>
                {isArtisan ? (
                  <>
                    <h3 className="saaf-dashboard-side-title">{t('Keep your workshop active')}</h3>
                    <p className="mb-0 text-muted">
                      {t('Review your public presence, upload new work, and stay close to incoming opportunities.')}
                    </p>
                  </>
                ) : isStaff ? (
                  <>
                    <h3 className="saaf-dashboard-side-title">{t('Moderation and oversight')}</h3>
                    <p className="mb-0 text-muted">
                      {t('Jump between moderation, categories, and user operations from one clean surface.')}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="saaf-dashboard-side-title">{t('Move projects faster')}</h3>
                    <p className="mb-0 text-muted">
                      {t('Post requests, compare artisans, and keep your account details ready for smoother project starts.')}
                    </p>
                  </>
                )}
              </div>
              <div className="saaf-dashboard-mini-stats">
                <div className="saaf-dashboard-mini-stat">
                  <span className="saaf-info-label">{t('Username')}</span>
                  <strong>@{data?.username}</strong>
                </div>
                <div className="saaf-dashboard-mini-stat">
                  <span className="saaf-info-label">{t('Joined')}</span>
                  <strong>{formatMonthYear(data?.date_joined)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───────── Shortcuts ───────── */}
        <div className="saaf-dashboard-section-head mb-3">
          <div>
            <p className="saaf-eyebrow mb-1">{t('Shortcuts')}</p>
            <h2 className="saaf-dashboard-section-title mb-0">{t('Your main actions')}</h2>
          </div>
        </div>

        <div className="row g-3 g-lg-4">
          {isArtisan ? (
            <>
              <ShortcutCard
                to={`/workshop/${user?.id}`}
                title={t('My Workshop')}
                desc={t('Review your public workshop profile and keep your storefront sharp.')}
                icon="bi bi-shop"
                cta={t('Open workshop')}
              />
              <ShortcutCard
                to="/portfolio/upload"
                title={t('Portfolio')}
                desc={t('Upload new work samples and keep your strongest pieces visible.')}
                icon="bi bi-images"
                cta={t('Manage gallery')}
              />
              <ShortcutCard
                to="/requests"
                title={t('Open Requests')}
                desc={t('Browse active customer requests and spot the next fit for your craft.')}
                icon="bi bi-briefcase"
                cta={t('Explore listings')}
              />
            </>
          ) : (
            <>
              <ShortcutCard
                to="/requests/new"
                title={t('Post a Request')}
                desc={t('Start a new custom project request with clearer details and quicker replies.')}
                icon="bi bi-plus-square"
                cta={t('Create now')}
              />
              <ShortcutCard
                to="/requests"
                title={t('Discover')}
                desc={t('Explore marketplace requests and artisans with a cleaner starting point.')}
                icon="bi bi-compass"
                cta={t('Start browsing')}
              />
              <ShortcutCard
                to={isStaff ? '/staff/profile' : `/profile/${user?.username}`}
                title={t('My Profile')}
                desc={t('Review your contact details, profile info, and account presence.')}
                icon="bi bi-person-circle"
                cta={t('Open profile')}
              />
            </>
          )}
        </div>

        {/* ───────── Client Overview (requesters only) ───────── */}
        {isRequester && (
          <>
            <div className="saaf-dashboard-section-head mb-3 mt-4">
              <div>
                <p className="saaf-eyebrow mb-1">{t('Client Overview')}</p>
                <h2 className="saaf-dashboard-section-title mb-0">{t('Your alerts and requests')}</h2>
              </div>
            </div>

            <div className="row g-3 g-lg-4 mb-4">
              <OverviewCard
                to="/my-requests"
                label={t('My Requests')}
                value={data.my_requests_total || 0}
                meta={`${t('Open')} ${data.requests_open_total || 0} • ${t('In Review')} ${data.requests_in_review_total || 0}`}
              />
              <OverviewCard
                to="/notifications"
                label={t('Unread Notifications')}
                value={data.unread_notifications_count || 0}
                meta={t('Go to notification center')}
              />
              <OverviewCard
                to="/messages"
                label={t('Unread Messages')}
                value={data.unread_messages_count || 0}
                meta={`${t('Active chats')} ${data.active_conversations_count || 0}`}
              />
              <OverviewCard
                to="/my-requests"
                label={t('Pending Proposals')}
                value={data.proposals_pending_total || 0}
                meta={`${t('Total proposals')} ${data.proposals_total || 0}`}
              />
            </div>

            <div className="row g-3 g-lg-4">
              {/* Notifications */}
              <div className="col-lg-5">
                <div className="saaf-dashboard-card rounded-4 p-4 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="mb-0">{t('Latest Notifications')}</h5>
                    <Link to="/notifications" className="saaf-dashboard-linkline">
                      {t('View all')} <i className="bi bi-arrow-right-short"></i>
                    </Link>
                  </div>

                  {data.notifications_recent?.length > 0 ? (
                    <div className="saaf-client-notif-list">
                      {data.notifications_recent.map((n) => (
                        <Link key={n.id} to={n.link || '#'} className="saaf-tile-link">
                          <div className="saaf-client-notif-item">
                            <span className="saaf-client-notif-dot"></span>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--saaf-heading)' }}>
                                {n.title}
                              </div>
                              <div style={{ fontSize: '.83rem', color: 'var(--saaf-text-muted)' }}>
                                {formatDate(n.created_at)}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">{t('No recent notifications.')}</p>
                  )}
                </div>
              </div>

              {/* My Latest Requests */}
              <div className="col-lg-7">
                <div className="saaf-dashboard-card rounded-4 p-4 h-100">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                    <h5 className="mb-0">{t('My Latest Requests')}</h5>
                    <div className="saaf-client-filter">
                      <label htmlFor="request_status" className="saaf-info-label mb-0">
                        {t('Status')}
                      </label>
                      <select
                        id="request_status"
                        value={statusFilter}
                        onChange={handleStatusChange}
                      >
                        <option value="all">{t('All')}</option>
                        <option value="open">{t('Open')}</option>
                        <option value="in_review">{t('In Review')}</option>
                        <option value="closed">{t('Closed')}</option>
                        <option value="time_ended">{t('Time Ended')}</option>
                      </select>
                    </div>
                  </div>

                  {data.my_requests_recent?.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table align-middle mb-0 saaf-requests-table">
                        <thead>
                          <tr>
                            <th>{t('Request')}</th>
                            <th>{t('Status')}</th>
                            <th>{t('Proposals')}</th>
                            <th className="text-end">{t('View')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.my_requests_recent.map((req) => (
                            <tr key={req.id}>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--saaf-heading)' }}>
                                  {req.title}
                                </div>
                                <div style={{ fontSize: '.8rem', color: 'var(--saaf-text-muted)' }}>
                                  {formatDate(req.created_at)}
                                </div>
                              </td>
                              <td>
                                <span className={`saaf-req-status-pill saaf-req-status-pill--${req.status.replace('_', '-')}`}>
                                  {req.status_display}
                                </span>
                              </td>
                              <td>{req.proposal_count}</td>
                              <td className="text-end">
                                <Link to={`/requests/${req.id}`} className="saaf-req-open-link">
                                  {t('Open')} <i className="bi bi-arrow-right-short"></i>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted mb-0">{t('No requests found for this filter.')}</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Small reusable sub-components
// ─────────────────────────────────────────────────────────

function ShortcutCard({ to, title, desc, icon, cta }) {
  return (
    <div className="col-md-4">
      <Link to={to} className="saaf-tile-link">
        <div className="saaf-dashboard-card saaf-dashboard-feature-card rounded-4 p-4 h-100">
          <div className="saaf-dashboard-tile-head">
            <h5 className="mb-0">{title}</h5>
            <span className="saaf-dashboard-tile-icon">
              <i className={icon}></i>
            </span>
          </div>
          <p className="text-muted mb-3">{desc}</p>
          <span className="saaf-dashboard-linkline">
            {cta} <i className="bi bi-arrow-right-short"></i>
          </span>
        </div>
      </Link>
    </div>
  )
}

function OverviewCard({ to, label, value, meta }) {
  return (
    <div className="col-6 col-lg-3">
      <Link to={to} className="saaf-tile-link">
        <div className="saaf-client-overview-card">
          <span className="saaf-client-overview-label">{label}</span>
          <div className="saaf-client-overview-value">{value}</div>
          <div className="saaf-client-overview-meta">{meta}</div>
        </div>
      </Link>
    </div>
  )
}