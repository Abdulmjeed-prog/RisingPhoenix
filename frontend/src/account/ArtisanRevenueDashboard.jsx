import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import api from '../api/axios'
import { useTheme } from '../hooks/useTheme'
import { useStripeStatus } from '../hooks/useStripeStatus'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

function fmtMoney(v) {
  return parseFloat(v || 0).toFixed(2)
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export default function ArtisanRevenueDashboard() {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { status: stripe, loading: stripeLoading, starting: stripeStarting, startOnboarding } = useStripeStatus()
  const [searchParams] = useSearchParams()
  const justReturned = searchParams.get('stripe') === 'return'

  useEffect(() => {
    api
      .get('/auth/artisan-dashboard/')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{t('Unable to load dashboard.')}</div>
      </div>
    )
  }

  const { user, stats, chart, active_requests, completed_requests, recent_revenues } = data
  const isDark = theme === 'dark'

  const earned = parseFloat(stats.total_earned) || 0
  const paid = parseFloat(stats.total_paid) || 0
  const payoutPct = earned > 0 ? Math.min((paid / earned) * 100, 100) : 0

  // Chart config
  const chartData = {
    labels: chart.labels.length ? chart.labels : ['—'],
    datasets: [
      {
        label: t('Revenue'),
        data: chart.totals.length ? chart.totals : [0],
        fill: true,
        backgroundColor: (ctx) => {
          const canvas = ctx.chart.ctx
          const grad = canvas.createLinearGradient(0, 0, 0, 230)
          grad.addColorStop(0, isDark ? 'rgba(212,139,104,.28)' : 'rgba(199,122,92,.22)')
          grad.addColorStop(1, 'rgba(199,122,92,.00)')
          return grad
        },
        borderColor: isDark ? '#D48B68' : '#C77A5C',
        borderWidth: 2.5,
        pointBackgroundColor: isDark ? '#D48B68' : '#C77A5C',
        pointBorderColor: isDark ? '#241B15' : '#FAF1E5',
        pointBorderWidth: 2.5,
        pointRadius: 5,
        tension: 0.42,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1B140F' : '#3F2D23',
        titleColor: '#E9D9C3',
        bodyColor: '#D48B68',
        padding: 10,
        callbacks: {
          label: (c) => '  ' + c.parsed.y.toFixed(2),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#c9b79f' : '#6A5648', font: { size: 11 } },
      },
      y: {
        grid: { color: isDark ? 'rgba(219,191,155,.1)' : 'rgba(96,70,51,.07)' },
        ticks: {
          color: isDark ? '#c9b79f' : '#6A5648',
          font: { size: 11 },
          callback: (v) => v.toFixed(0),
        },
      },
    },
  }

  return (
    <div className="saaf-main rev-shell">
      <div className="container-fluid px-0">
        {/* ── Page Header ── */}
        <div className="rev-page-header mb-4">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div>
              <div className="saaf-eyebrow mb-1">
                <i className="bi bi-bar-chart-line me-1"></i>
                {t('Earnings Dashboard')}
              </div>
              <h2 className="saaf-section-title mb-1" style={{ fontSize: '1.65rem' }}>
                {t('Welcome back,')} {user.full_name}
              </h2>
              <p className="mb-0" style={{ fontSize: '.88rem', color: 'var(--saaf-text-muted)' }}>
                {t("Here's your financial overview at a glance")}
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap" style={{ position: 'relative', zIndex: 1 }}>
              {!stripeLoading && stripe && (
                <>
                  {!stripe.connected && (
                    <button
                      type="button"
                      className="btn btn-saaf-primary rounded-pill"
                      style={{ fontSize: '.87rem' }}
                      onClick={startOnboarding}
                      disabled={stripeStarting}
                    >
                      <i className="bi bi-stripe me-1"></i>
                      {stripeStarting ? t('Redirecting...') : t('Connect Stripe')}
                    </button>
                  )}

                  {stripe.connected && stripe.payouts_enabled && (
                    <span className="btn rounded-pill" style={{
                      fontSize: '.87rem',
                      background: 'rgba(76,175,125,.13)',
                      color: '#2b7a52',
                      border: '1px solid rgba(76,175,125,.3)',
                    }}>
                      <i className="bi bi-check-circle-fill me-1"></i>
                      {t('Stripe Active')}
                    </span>
                  )}

                  {stripe.connected && !stripe.payouts_enabled && (
                    <button
                      type="button"
                      className="btn rounded-pill"
                      style={{
                        fontSize: '.87rem',
                        background: 'rgba(212,169,45,.13)',
                        color: '#7a5200',
                        border: '1px solid rgba(212,169,45,.3)',
                      }}
                      onClick={startOnboarding}
                      disabled={stripeStarting}
                    >
                      <i className="bi bi-exclamation-circle-fill me-1"></i>
                      {stripe.requirements_due > 0
                        ? `${stripe.requirements_due} ${t('items required')}`
                        : t('Finish Stripe Setup')}
                    </button>
                  )}
                </>
              )}

              <button type="button" className="btn btn-saaf-outline rounded-pill" style={{ fontSize: '.87rem' }}>
                <i className="bi bi-download me-1"></i>
                {t('Export')}
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="rev-stat-card">
              <div className="rev-stat-icon"><i className="bi bi-wallet2"></i></div>
              <div className="rev-stat-value">{fmtMoney(stats.current_balance)}</div>
              <div className="rev-stat-label">{t('Current Balance')}</div>
              <span className="rev-stat-badge rbadge-up">
                <i className="bi bi-check-circle me-1"></i>{t('Available')}
              </span>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="rev-stat-card accent-green">
              <div className="rev-stat-icon"><i className="bi bi-currency-dollar"></i></div>
              <div className="rev-stat-value">{fmtMoney(stats.total_earned)}</div>
              <div className="rev-stat-label">{t('Total Earned')}</div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="rev-stat-card accent-blue">
              <div className="rev-stat-icon"><i className="bi bi-send-check-fill"></i></div>
              <div className="rev-stat-value">{fmtMoney(stats.total_paid)}</div>
              <div className="rev-stat-label">{t('Total Paid Out')}</div>
              <span className="rev-stat-badge rbadge-info">{t('Transferred')}</span>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="rev-stat-card accent-amber">
              <div className="rev-stat-icon"><i className="bi bi-calendar2-week-fill"></i></div>
              <div className="rev-stat-value">{fmtMoney(stats.this_month_total)}</div>
              <div className="rev-stat-label">{t('This Month')}</div>
              <span className="rev-stat-badge" style={{ background: 'rgba(212,169,45,.13)', color: '#7a5a00' }}>
                {stats.this_month_jobs} {stats.this_month_jobs === 1 ? t('job') : t('jobs')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Chart + Quick Stats ── */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-8">
            <div className="rev-panel h-100">
              <div className="rev-panel-title">
                <span>
                  <i className="bi bi-graph-up me-1" style={{ color: 'var(--saaf-btn)' }}></i>
                  {t('Monthly Revenue')}
                </span>
                <small>{t('Last 12 months')}</small>
              </div>
              <div style={{ position: 'relative', height: 230 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="rev-panel h-100 d-flex flex-column" style={{ gap: '1.2rem' }}>
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--saaf-text-muted)' }}>
                    {t('Payout Progress')}
                  </span>
                  <span style={{ fontSize: '.8rem', color: 'var(--saaf-btn)', fontWeight: 700 }}>
                    {earned > 0 ? `${paid.toFixed(0)} / ${earned.toFixed(0)}` : '—'}
                  </span>
                </div>
                <div className="rev-goal-bar">
                  <div className="rev-goal-fill" style={{ width: `${payoutPct}%` }}></div>
                </div>
                <div style={{ fontSize: '.74rem', color: 'var(--saaf-text-muted)' }}>
                  {earned > 0
                    ? `${paid.toFixed(2)} ${t('of')} ${earned.toFixed(2)}`
                    : t('No earnings yet')}
                </div>
              </div>

              <div>
                <div className="rev-panel-title" style={{ marginBottom: '.75rem', fontSize: '.88rem' }}>
                  {t('This Month at a Glance')}
                </div>
                <div>
                  <div className="rev-qs-row">
                    <span>{t('Completed Jobs')}</span>
                    <strong style={{ color: 'var(--saaf-btn)' }}>{stats.this_month_jobs}</strong>
                  </div>
                  <div className="rev-qs-row">
                    <span>{t('Revenue')}</span>
                    <strong style={{ color: 'var(--saaf-btn)' }}>{fmtMoney(stats.this_month_total)}</strong>
                  </div>
                  <div className="rev-qs-row">
                    <span>{t('Pending Balance')}</span>
                    <strong>{fmtMoney(stats.current_balance)}</strong>
                  </div>
                  <div className="rev-qs-row">
                    <span>{t('Total Paid Out')}</span>
                    <strong>{fmtMoney(stats.total_paid)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Active Requests ── */}
        <div className="rev-panel mb-4">
          <div className="rev-panel-title">
            <span>
              <i className="bi bi-hourglass-split me-1" style={{ color: 'var(--saaf-btn)' }}></i>
              {t('Active Requests')}
            </span>
            <small>{active_requests.length}</small>
          </div>

          {active_requests.length > 0 ? (
            <div className="table-responsive">
              <table className="rev-table">
                <thead>
                  <tr>
                    <th>{t('Title')}</th>
                    <th>{t('Requester')}</th>
                    <th>{t('Price')}</th>
                    <th>{t('Status')}</th>
                    <th className="text-end">{t('Details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {active_requests.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--saaf-heading)' }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: '.74rem', color: 'var(--saaf-text-muted)' }}>
                          #{c.id}
                        </div>
                      </td>
                      <td>{c.requester_name}</td>
                      <td>{fmtMoney(c.price)}</td>
                      <td>
                        <span className="rev-pill pill-pending">
                          <span className="rev-pill-dot"></span>
                          {t('In Progress')}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link to={`/contracts/${c.id}`} className="saaf-dashboard-linkline">
                          {t('View')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rev-empty">
              <i className="bi bi-inbox"></i>
              <p>{t('No active requests right now.')}</p>
            </div>
          )}
        </div>

        {/* ── Completed Requests ── */}
        <div className="rev-panel mb-4">
          <div className="rev-panel-title">
            <span>
              <i className="bi bi-check2-circle me-1" style={{ color: 'var(--saaf-btn)' }}></i>
              {t('Completed Requests')}
            </span>
            <Link to="/completed-orders" className="saaf-dashboard-linkline" style={{ fontSize: '.83rem' }}>
              {t('View all')} <i className="bi bi-arrow-right"></i>
            </Link>
          </div>

          {completed_requests.length > 0 ? (
            <div className="table-responsive">
              <table className="rev-table">
                <thead>
                  <tr>
                    <th>{t('Title')}</th>
                    <th>{t('Requester')}</th>
                    <th>{t('Price')}</th>
                    <th>{t('Status')}</th>
                    <th className="text-end">{t('Details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {completed_requests.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--saaf-heading)' }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: '.74rem', color: 'var(--saaf-text-muted)' }}>
                          #{c.id}
                        </div>
                      </td>
                      <td>{c.requester_name}</td>
                      <td>{fmtMoney(c.price)}</td>
                      <td>
                        <span className="rev-pill pill-paid">
                          <span className="rev-pill-dot"></span>
                          {t('Completed')}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link to={`/contracts/${c.id}`} className="saaf-dashboard-linkline">
                          {t('View')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rev-empty">
              <i className="bi bi-check2-circle"></i>
              <p>{t('No completed requests yet.')}</p>
            </div>
          )}
        </div>

        {/* ── Recent Transactions ── */}
        <div className="rev-panel">
          <div className="rev-panel-title">
            <span>
              <i className="bi bi-receipt me-1" style={{ color: 'var(--saaf-btn)' }}></i>
              {t('Recent Transactions')}
            </span>
            <a href="#" className="saaf-dashboard-linkline" style={{ fontSize: '.83rem' }}>
              {t('View all')} <i className="bi bi-arrow-right"></i>
            </a>
          </div>

          {recent_revenues.length > 0 ? (
            <div className="table-responsive">
              <table className="rev-table">
                <thead>
                  <tr>
                    <th>{t('Contract')}</th>
                    <th>{t('Net Amount')}</th>
                    <th>{t('Status')}</th>
                    <th>{t('Date')}</th>
                    <th className="text-end">{t('Details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_revenues.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--saaf-heading)' }}>
                          {r.contract_title || '—'}
                        </div>
                        <div style={{ fontSize: '.74rem', color: 'var(--saaf-text-muted)' }}>#{r.id}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--saaf-heading)' }}>
                          {fmtMoney(r.net_amount)}
                        </span>
                      </td>
                      <td>
                        {r.status === 'paid' ? (
                          <span className="rev-pill pill-paid"><span className="rev-pill-dot"></span>{t('Paid')}</span>
                        ) : r.status === 'earned' ? (
                          <span className="rev-pill pill-earned"><span className="rev-pill-dot"></span>{t('Earned')}</span>
                        ) : r.status === 'canceled' ? (
                          <span className="rev-pill" style={{ background: 'rgba(192,57,43,.12)', color: '#a93226' }}>
                            <span className="rev-pill-dot"></span>{t('Canceled')}
                          </span>
                        ) : (
                          <span className="rev-pill pill-pending"><span className="rev-pill-dot"></span>{t('Pending')}</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--saaf-text-muted)', fontSize: '.82rem', whiteSpace: 'nowrap' }}>
                        {fmtDate(r.created_at)}
                      </td>
                      <td className="text-end">
                        <a href="#" className="saaf-dashboard-linkline" style={{ fontSize: '.82rem' }}>
                          {t('View')} <i className="bi bi-chevron-right" style={{ fontSize: '.7rem' }}></i>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rev-empty">
              <i className="bi bi-inbox"></i>
              <p style={{ fontSize: '.88rem' }}>
                {t('No transactions yet. Complete a contract to see your earnings here.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}