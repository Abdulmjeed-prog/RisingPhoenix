import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

function fmtMoney(v) {
  const n = parseFloat(v || 0)
  return n.toFixed(2)
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export default function ArtisanDashboard() {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/account/artisan-dashboard/')
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

  const { user, stats, chart, stripe, active_requests, completed_requests, recent_revenues } = data

  const isDark = theme === 'dark'

  // ── Chart config ──
  const chartData = {
    labels: chart.labels.length ? chart.labels : ['—'],
    datasets: [
      {
        label: t('Revenue'),
        data: chart.totals.length ? chart.totals : [0],
        fill: true,
        backgroundColor: (ctx) => {
          const canvas = ctx.chart.ctx
          const h = canvas.canvas.offsetHeight || 230
          const grad = canvas.createLinearGradient(0, 0, 0, h)
          grad.addColorStop(0, isDark ? 'rgba(212,139,104,.28)' : 'rgba(199,122,92,.22)')
          grad.addColorStop(1, 'rgba(199,122,92,.00)')
          return grad
        },
        borderColor: isDark ? '#D48B68' : '#C77A5C',
        borderWidth: 2.5,
        pointBackgroundColor: isDark ? '#D48B68' : '#C77A5C',
        pointBorderColor: isDark ? '#241B15' : '#FAF1E5',
        pointBorderWidth: 2.5,
        pointRadius: 4,
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
        ticks: {
          color: isDark ? '#c9b79f' : '#6A5648',
          font: { size: 11 },
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(219,191,155,.1)' : 'rgba(96,70,51,.07)',
        },
        ticks: {
          color: isDark ? '#c9b79f' : '#6A5648',
          font: { size: 11 },
          callback: (v) => v.toFixed(0),
        },
      },
    },
  }

  // ── Payout progress ──
  const earned = parseFloat(stats.total_earned) || 0
  const paid = parseFloat(stats.total_paid) || 0
  const payoutPct = earned > 0 ? Math.min((paid / earned) * 100, 100) : 0

  const renderStripeButton = () => {
    if (!stripe.connected) {
      return (
        <a href="/account/artisan/connect-stripe/" className="btn btn-saaf-primary rounded-pill" style={{ fontSize: '.87rem' }}>
          <i className="bi bi-stripe me-1"></i>{t('Connect Stripe')}
        </a>
      )
    }
    if (stripe.payouts_enabled) {
      return (
        <button type="button" className="btn rounded-pill" style={{ fontSize: '.87rem', background: 'rgba(76,175,125,.13)', color: '#2b7a52', border: '1px solid rgba(76,175,125,.3)' }}>
          <i className="bi bi-check-circle-fill me-1"></i>{t('Stripe Active')}
        </button>
      )
    }
    return (
      <button type="button" className="btn rounded-pill" style={{ fontSize: '.87rem', background: 'rgba(91,141,238,.11)', color: '#2244a8', border: '1px solid rgba(91,141,238,.25)' }}>
        <i className="bi bi-hourglass-split me-1"></i>{t('Stripe Pending')}
      </button>
    )
  }

  return (
    <div className="rev-page">
      {/* ══ Header ══ */}
      <div className="rev-header">
        <div className="rev-header-inner">
          <div>
            <div className="rev-eyebrow">
              <i className="bi bi-bar-chart-line"></i> {t('Earnings Dashboard')}
            </div>
            <h2 className="rev-header-title">
              {t('Welcome back,')} {user.full_name}
            </h2>
            <p className="rev-header-sub">{t("Here's your financial overview at a glance")}</p>
          </div>
          <div className="rev-header-actions">{renderStripeButton()}</div>
        </div>
      </div>

      {/* ══ Stat cards ══ */}
      <div className="rev-stats-grid">
        <div className="rev-stat">
          <div className="rev-stat-icon"><i className="bi bi-wallet2"></i></div>
          <div className="rev-stat-num">{fmtMoney(stats.current_balance)}</div>
          <div className="rev-stat-lbl">{t('Current Balance')}</div>
          <span className="rev-stat-badge rbadge-up">
            <i className="bi bi-check-circle me-1"></i>{t('Available')}
          </span>
        </div>

        <div className="rev-stat green">
          <div className="rev-stat-icon"><i className="bi bi-currency-dollar"></i></div>
          <div className="rev-stat-num">{fmtMoney(stats.total_earned)}</div>
          <div className="rev-stat-lbl">{t('Total Earned')}</div>
        </div>

        <div className="rev-stat blue">
          <div className="rev-stat-icon"><i className="bi bi-send-check-fill"></i></div>
          <div className="rev-stat-num">{fmtMoney(stats.total_paid)}</div>
          <div className="rev-stat-lbl">{t('Total Paid Out')}</div>
          <span className="rev-stat-badge rbadge-info">{t('Transferred')}</span>
        </div>

        <div className="rev-stat amber">
          <div className="rev-stat-icon"><i className="bi bi-calendar2-week-fill"></i></div>
          <div className="rev-stat-num">{fmtMoney(stats.this_month_total)}</div>
          <div className="rev-stat-lbl">{t('This Month')}</div>
          <span className="rev-stat-badge" style={{ background: 'rgba(212,169,45,.13)', color: '#7a5a00' }}>
            {stats.this_month_jobs} {stats.this_month_jobs === 1 ? t('job') : t('jobs')}
          </span>
        </div>
      </div>

      {/* ══ Chart + Side panel ══ */}
      <div className="rev-mid-row">
        <div className="rev-panel">
          <div className="rev-panel-hd">
            <div className="rev-panel-hd-title">
              <i className="bi bi-graph-up"></i>{t('Monthly Revenue')}
            </div>
            <small>{t('Last 12 months')}</small>
          </div>
          <div className="rev-chart-box">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="rev-panel rev-side-panel">
          <div>
            <div className="rev-progress-label">
              <span>{t('Payout Progress')}</span>
              <strong>
                {earned > 0 ? `${paid.toFixed(0)} / ${earned.toFixed(0)}` : '—'}
              </strong>
            </div>
            <div className="rev-bar">
              <div className="rev-bar-fill" style={{ width: `${payoutPct}%` }}></div>
            </div>
            <div className="rev-bar-sub">
              {earned > 0
                ? `${paid.toFixed(2)} ${t('of')} ${earned.toFixed(2)}`
                : t('No earnings yet')}
            </div>
          </div>

          <div>
            <div className="rev-qs-title">{t('This Month at a Glance')}</div>
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

      {/* ══ Active Requests ══ */}
      <div className="rev-panel rev-table-panel">
        <div className="rev-panel-hd">
          <div className="rev-panel-hd-title">
            <i className="bi bi-hourglass-split"></i>{t('Active Requests')}
          </div>
          <small>{active_requests.length}</small>
        </div>

        {active_requests.length > 0 ? (
          <div className="table-responsive">
            <table className="rev-table">
              <thead>
                <tr>
                  <th>{t('Title')}</th>
                  <th>{t('Status')}</th>
                  <th className="text-end">{t('Details')}</th>
                </tr>
              </thead>
              <tbody>
                {active_requests.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="rev-td-title">{c.title}</div>
                      <div className="rev-td-id">#{c.id}</div>
                    </td>
                    <td>
                      <span className="rev-pill pill-pending">
                        <span className="rev-pill-dot"></span>{t('In Progress')}
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

      {/* ══ Completed Requests ══ */}
      <div className="rev-panel rev-table-panel">
        <div className="rev-panel-hd">
          <div className="rev-panel-hd-title">
            <i className="bi bi-check2-circle"></i>{t('Completed Requests')}
          </div>
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
                  <th>{t('Status')}</th>
                  <th className="text-end">{t('Details')}</th>
                </tr>
              </thead>
              <tbody>
                {completed_requests.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="rev-td-title">{c.title}</div>
                      <div className="rev-td-id">#{c.id}</div>
                    </td>
                    <td>
                      <span className="rev-pill pill-paid">
                        <span className="rev-pill-dot"></span>{t('Completed')}
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

      {/* ══ Recent Transactions ══ */}
      <div className="rev-panel rev-table-panel" style={{ marginBottom: 0 }}>
        <div className="rev-panel-hd">
          <div className="rev-panel-hd-title">
            <i className="bi bi-receipt"></i>{t('Recent Transactions')}
          </div>
        </div>

        {recent_revenues.length > 0 ? (
          <div className="table-responsive">
            <table className="rev-table">
              <thead>
                <tr>
                  <th className="rev-col-mobile-hide">{t('Net Amount')}</th>
                  <th className="rev-col-mobile-hide">{t('Status')}</th>
                  <th className="rev-col-mobile-hide">{t('Date')}</th>
                </tr>
              </thead>
              <tbody>
                {recent_revenues.map((r) => (
                  <tr key={r.id}>
                    <td className="rev-col-mobile-hide">
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--saaf-heading)' }}>
                        {fmtMoney(r.net_amount)}
                      </span>
                    </td>
                    <td className="rev-col-mobile-hide">
                      {r.status === 'paid' ? (
                        <span className="rev-pill pill-paid"><span className="rev-pill-dot"></span>{t('Paid')}</span>
                      ) : r.status === 'earned' ? (
                        <span className="rev-pill pill-earned"><span className="rev-pill-dot"></span>{t('Earned')}</span>
                      ) : r.status === 'canceled' ? (
                        <span className="rev-pill" style={{ background: 'rgba(192,57,43,.12)', color: '#a93226' }}><span className="rev-pill-dot"></span>{t('Canceled')}</span>
                      ) : (
                        <span className="rev-pill pill-pending"><span className="rev-pill-dot"></span>{t('Pending')}</span>
                      )}
                    </td>
                    <td className="rev-col-mobile-hide" style={{ color: 'var(--saaf-text-muted)', whiteSpace: 'nowrap' }}>
                      {fmtDate(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rev-empty">
            <i className="bi bi-inbox"></i>
            <p>{t('No transactions yet. Complete a contract to see your earnings here.')}</p>
          </div>
        )}
      </div>
    </div>
  )
}