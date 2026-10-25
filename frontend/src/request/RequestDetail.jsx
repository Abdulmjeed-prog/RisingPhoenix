import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Lightbox from '../components/Lightbox'

function fmtMoney(v) {
  if (v === null || v === undefined) return null
  return `${parseFloat(v).toFixed(0)} SAR`
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const STATUS_PILL = {
  open: 'status-open',
  in_review: 'status-in-review',
  time_ended: 'status-time-ended',
  closed: 'status-closed',
}

const PROPOSAL_PILL = {
  pending: 'proposal-status-pill--pending',
  accepted: 'proposal-status-pill--accepted',
  rejected: 'proposal-status-pill--rejected',
  withdrawn: 'proposal-status-pill--withdrawn',
  in_progress: 'proposal-status-pill--in-progress',
}

export default function RequestDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightbox, setLightbox] = useState(null)   // { src, caption }
  const [suggested, setSuggested] = useState(null)
  const [invitingId, setInvitingId] = useState(null)
  const [reopenDate, setReopenDate] = useState('')
  const [reopening, setReopening] = useState(false)
  const [withdrawingId, setWithdrawingId] = useState(null)

  // Load request detail
  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .get(`/requests/${id}/`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Unable to load this request.'))
      .finally(() => setLoading(false))
  }, [id])

  // Load suggested artisans for the requester (only when open)
  useEffect(() => {
    if (!data || !data.is_requester || data.status !== 'open') return
    api
      .get(`/requests/suggested-artisans/`, {
        params: { category_id: data.category_id || '', request_id: id },
      })
      .then((res) => setSuggested(res.data.artisans || []))
      .catch(() => setSuggested([]))
  }, [data, id])

  const handleInvite = async (artisanUserId) => {
    setInvitingId(artisanUserId)
    try {
      await api.post(`/requests/${id}/invite/`, { artisan_user_id: artisanUserId })
      setSuggested((prev) =>
        (prev || []).map((a) =>
          a.artisan_user_id === artisanUserId ? { ...a, already_invited: true } : a
        )
      )
    } catch (err) {
      // 409 = already invited, treat as success
      if (err.response?.status === 409) {
        setSuggested((prev) =>
          (prev || []).map((a) =>
            a.artisan_user_id === artisanUserId ? { ...a, already_invited: true } : a
          )
        )
      } else {
        alert(err.response?.data?.error || 'Could not send invitation.')
      }
    } finally {
      setInvitingId(null)
    }
  }

  const handleReopen = async (e) => {
    e.preventDefault()
    if (!reopenDate) return
    setReopening(true)
    try {
      await api.post(`/requests/${id}/reopen/`, { new_deadline: reopenDate })
      const res = await api.get(`/requests/${id}/`)
      setData(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Could not reopen request.')
    } finally {
      setReopening(false)
    }
  }

  const handleWithdraw = async (proposalId) => {
    if (!window.confirm('Withdraw this proposal?')) return
    setWithdrawingId(proposalId)
    try {
      await api.post(`/proposals/${proposalId}/withdraw/`)   // ← endpoint from proposal app
      const res = await api.get(`/requests/${id}/`)
      setData(res.data)
    } catch {
      alert('Could not withdraw.')
    } finally {
      setWithdrawingId(null)
    }
  }

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
        <div className="alert alert-danger">{error || t('Unable to load this request.')}</div>
        <Link to="/requests" className="btn btn-saaf-outline rounded-pill mt-3">
          ← {t('Back to browse')}
        </Link>
      </div>
    )
  }

  const isRequester = data.is_requester
  const isArtisan = data.is_artisan

  return (
    <section className="request-shell">
      <div className="request-container">
        {/* ───── Main card ───── */}
        <div className="request-detail-card">
          <div className="request-detail-head">
            <div>
              <p className="request-tag">{data.category_name}</p>
              <h1 className="request-detail-title">{data.title}</h1>
              <p className="request-detail-by">
                {t('Requested by')} {data.requester_username}
              </p>
            </div>
            <div className="request-detail-actions">
              <Link to="/requests" className="page-link">{t('Back to browse')}</Link>
              {isRequester && data.can_edit && (
                <Link to={`/requests/${id}/edit`} className="request-action">
                  {t('Edit request')}
                </Link>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="request-detail-meta">
            <div className="request-detail-meta-item">
              <span className="request-label">{t('Budget')}</span>
              <p className="mb-0">
                {fmtMoney(data.budget_max) || t('Flexible')}
              </p>
            </div>
            <div className="request-detail-meta-item">
              <span className="request-label">{t('Deadline')}</span>
              <p className="mb-0">{data.deadline ? fmtDate(data.deadline) : t('Flexible')}</p>
            </div>
            <div className="request-detail-meta-item">
              <span className="request-label">{t('Status')}</span>
              <p className="mb-0">
                <span className={`status-pill ${STATUS_PILL[data.status] || ''}`}>
                  {data.status_display}
                </span>
              </p>
            </div>
            <div className="request-detail-meta-item">
              <span className="request-label">{t('Posted')}</span>
              <p className="mb-0">{fmtDate(data.created_at)}</p>
            </div>
          </div>

          {/* Images */}
          {data.images?.length > 0 && (
            <div className="request-detail-body">
              <h2 className="request-detail-subtitle">{t('Reference Images')}</h2>
              <div className="request-detail-gallery">
                {data.images.map((img, idx) => (
                  <div key={img.id} className="request-detail-gallery-item">
                    <button
                      type="button"
                      className="gallery-img-btn"
                      onClick={() => setLightbox({ src: img.url, caption: img.caption })}
                      aria-label={`${t('View image')} ${idx + 1}`}
                    >
                      <img src={img.url} alt={`${t('Reference image')} ${idx + 1}`} />
                    </button>
                    {img.caption && <p className="request-image-caption">{img.caption}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="request-detail-body">
            <h2 className="request-detail-subtitle">{t('Project Description')}</h2>
            <p className="request-detail-description">
              {data.description.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </p>
          </div>

          {/* Time-ended note + reopen */}
          {data.status === 'time_ended' && (
            <div className="request-time-ended-note">
              {data.deadline ? (
                <p>{t('This request was automatically marked as time ended because the deadline has passed.')}</p>
              ) : (
                <p>{t('This request has ended.')}</p>
              )}
              {data.can_reopen && (
                <form onSubmit={handleReopen} className="reopen-form">
                  <label>{t('Set a new deadline to reopen:')}</label>
                  <input
                    type="date"
                    className="request-input reopen-date-input"
                    value={reopenDate}
                    onChange={(e) => setReopenDate(e.target.value)}
                    required
                  />
                  <button type="submit" className="request-action reopen-btn" disabled={reopening}>
                    {reopening ? t('Reopening...') : t('Reopen Request')}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ───── Proposals panel ───── */}
        <div className="proposal-panel">
          {/* Not requester — CTAs */}
          {!isRequester && (
            <>
              {!user && (
                <div className="proposal-cta-box">
                  <p>
                    {t('Want to work on this project?')}{' '}
                    <Link to="/login">{t('Log in')}</Link> {t('to submit a proposal.')}
                  </p>
                </div>
              )}

              {user && !isArtisan && (
                <div className="proposal-cta-box">
                  <p>
                    {t('Only artisans can submit proposals.')}{' '}
                    <Link to="/register/artisan">{t('Become an artisan')}</Link>{' '}
                    {t('to get started.')}
                  </p>
                </div>
              )}

              {user && isArtisan && data.can_submit && (
                <div className="proposal-panel-header">
                  <h2 className="proposal-panel-title">{t('Interested in this project?')}</h2>
                  <Link to={`/requests/${id}/submit-proposal`} className="request-action">
                    {t('Submit a proposal')}
                  </Link>
                </div>
              )}

              {user && isArtisan && data.user_proposal && (
                <>
                  <div className="proposal-panel-header">
                    <h2 className="proposal-panel-title">{t('Your Proposal')}</h2>
                    <div className="proposal-panel-header-actions">
                      {data.user_proposal.status === 'pending' && (
                        <>
                          <Link to={`/proposals/${data.user_proposal.id}/edit`} className="proposal-action-btn">
                            {t('Edit')}
                          </Link>
                          <button
                            type="button"
                            className="proposal-action-btn proposal-action-btn--danger"
                            onClick={() => handleWithdraw(data.user_proposal.id)}
                            disabled={withdrawingId === data.user_proposal.id}
                          >
                            {t('Withdraw')}
                          </button>
                        </>
                      )}
                      {data.user_proposal.status === 'withdrawn' &&
                        (data.status === 'open' || data.status === 'in_review') && (
                          <Link
                            to={`/requests/${id}/submit-proposal`}
                            className="proposal-action-btn proposal-action-btn--accept"
                          >
                            {t('Re-submit Proposal')}
                          </Link>
                        )}
                      {data.user_proposal.status === 'accepted' && data.user_proposal.contract_id && (
                        <Link
                          to={`/contracts/${data.user_proposal.contract_id}`}
                          className="proposal-action-btn proposal-action-btn--accept"
                        >
                          <i className="bi bi-box-arrow-up-right"></i> {t('View Project')}
                        </Link>
                      )}
                      {data.user_proposal.conversation_id ? (
                        <Link
                          to={`/messages/${data.user_proposal.conversation_id}`}
                          className="proposal-action-btn"
                        >
                          <i className="bi bi-chat-dots-fill"></i> {t('Open Chat')}
                        </Link>
                      ) : (
                        <Link
                          to={`/proposals/${data.user_proposal.id}/start-chat`}
                          className="proposal-action-btn"
                        >
                          <i className="bi bi-chat-dots-fill"></i> {t('Start Chat')}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className={`proposal-card proposal-card--${data.user_proposal.status}`}>
                    <div className="proposal-card-head">
                      <div className="proposal-card-stats-row">
                        <div className="proposal-card-stat">
                          <span className="proposal-stat-label">{t('Your price')}</span>
                          <span className="proposal-stat-value">{fmtMoney(data.user_proposal.price)}</span>
                        </div>
                        <div className="proposal-card-stat">
                          <span className="proposal-stat-label">{t('Est. completion')}</span>
                          <span className="proposal-stat-value">
                            {data.user_proposal.estimated_days} {t('days')}
                          </span>
                        </div>
                      </div>
                      <span className={`proposal-status-pill ${PROPOSAL_PILL[data.user_proposal.status] || ''}`}>
                        {data.user_proposal.status_display}
                      </span>
                    </div>
                    <p className="proposal-card-message">{data.user_proposal.message}</p>
                    {data.user_proposal.images?.length > 0 && (
                      <div className="proposal-card-gallery">
                        {data.user_proposal.images.map((img, idx) => (
                          <button
                            key={img.id}
                            type="button"
                            className="gallery-img-btn proposal-gallery-btn"
                            onClick={() => setLightbox({ src: img.url, caption: img.caption })}
                          >
                            <img src={img.url} alt={`Proposal image ${idx + 1}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {user && isArtisan && !data.can_submit && !data.user_proposal && (
                <div className="proposal-cta-box">
                  <p>{t('This request is no longer accepting proposals.')}</p>
                </div>
              )}
            </>
          )}

          {/* Requester view: suggested artisans + invitations (only when open) */}
          {isRequester && data.status === 'open' && (
            <>
              <div className="proposal-panel-header">
                <h2 className="proposal-panel-title">{t('Suggested artisans')}</h2>
              </div>
              <div className="suggested-artisans-list">
                {!suggested ? (
                  <p className="suggested-empty">{t('Loading suggestions…')}</p>
                ) : suggested.length === 0 ? (
                  <p className="suggested-empty">
                    {t('No matching artisans found yet for this category.')}
                  </p>
                ) : (
                  suggested.map((a) => (
                    <div key={a.artisan_user_id} className="suggested-card suggested-card--invite">
                      <Link to={`/workshop/${a.artisan_user_id}`} className="suggested-card-link">
                        <p className="suggested-name">{a.workshop_name}</p>
                        <p className="suggested-by">by @{a.artisan_username}</p>
                        {a.tagline && <p className="suggested-tagline">{a.tagline}</p>}
                        {a.location && <p className="suggested-location">{a.location}</p>}
                      </Link>
                      {a.already_invited ? (
                        <button type="button" className="invite-btn invite-btn--done" disabled>
                          {t('Invited')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="invite-btn"
                          onClick={() => handleInvite(a.artisan_user_id)}
                          disabled={invitingId === a.artisan_user_id}
                        >
                          {invitingId === a.artisan_user_id ? t('Sending…') : t('Invite')}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {data.invitations?.length > 0 && (
                <>
                  <div className="proposal-panel-header" style={{ marginTop: '1.25rem' }}>
                    <h2 className="proposal-panel-title">
                      {t('Invitations sent')}{' '}
                      <span className="proposal-count-badge">{data.invitations.length}</span>
                    </h2>
                  </div>
                  <ul className="invitations-sent-list">
                    {data.invitations.map((inv) => (
                      <li key={inv.id} className="invitation-row">
                        <span className="invitation-name">{inv.artisan_username}</span>
                        <span className={`invitation-status invitation-status--${inv.status}`}>
                          {inv.status_display}
                        </span>
                        <span className="invitation-when">{fmtDate(inv.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {/* Requester view: all proposals */}
          {isRequester && (
            <>
              <div
                className="proposal-panel-header"
                style={{ marginTop: data.status === 'open' ? '1.25rem' : 0 }}
              >
                <h2 className="proposal-panel-title">
                  {t('Proposals')}{' '}
                  <span className="proposal-count-badge">{data.proposals.length}</span>
                </h2>
              </div>

              {data.proposals.length === 0 ? (
                <p className="proposal-empty-note">{t('No proposals yet. Check back soon.')}</p>
              ) : (
                <div className="proposal-list">
                  {data.proposals.map((p) => (
                    <div key={p.id} className={`proposal-card proposal-card--${p.status}`}>
                      <div className="proposal-card-head">
                        <div className="proposal-card-artisan-col">
                          <div className="proposal-card-artisan-row">
                            <strong className="proposal-card-artisan">{p.artisan_username}</strong>
                            <div className="proposal-card-artisan-actions">
                              {p.conversation_id ? (
                                <Link className="proposal-chat-btn" to={`/messages/${p.conversation_id}`}>
                                  <i className="bi bi-chat-dots-fill"></i> <span>{t('Open Chat')}</span>
                                </Link>
                              ) : (
                                <Link className="proposal-chat-btn" to={`/proposals/${p.id}/start-chat`}>
                                  <i className="bi bi-chat-dots-fill"></i> <span>{t('Start Chat')}</span>
                                </Link>
                              )}
                              {p.status === 'accepted' && p.contract_id && (
                                <Link className="proposal-chat-btn" to={`/contracts/${p.contract_id}`}>
                                  <i className="bi bi-box-arrow-up-right"></i> <span>{t('View Project')}</span>
                                </Link>
                              )}
                            </div>
                          </div>
                          <div className="proposal-card-stats-row">
                            <div className="proposal-card-stat">
                              <span className="proposal-stat-label">{t('Price')}</span>
                              <span className="proposal-stat-value">{fmtMoney(p.price)}</span>
                            </div>
                            <div className="proposal-card-stat">
                              <span className="proposal-stat-label">{t('Est. completion')}</span>
                              <span className="proposal-stat-value">{p.estimated_days} {t('days')}</span>
                            </div>
                            <div className="proposal-card-stat">
                              <span className="proposal-stat-label">{t('Submitted')}</span>
                              <span className="proposal-stat-value">{fmtDate(p.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`proposal-status-pill ${PROPOSAL_PILL[p.status] || ''}`}>
                          {p.status_display}
                        </span>
                      </div>
                      <p className="proposal-card-message">{p.message}</p>
                      {p.images?.length > 0 && (
                        <div className="proposal-card-gallery">
                          {p.images.map((img, idx) => (
                            <button
                              key={img.id}
                              type="button"
                              className="gallery-img-btn proposal-gallery-btn"
                              onClick={() => setLightbox({ src: img.url, caption: img.caption })}
                            >
                              <img src={img.url} alt={`Proposal image ${idx + 1}`} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Review (when request has one) */}
          {data.review && (
            <div className="request-review-section">
              <h2 className="request-review-heading">{t('Review')}</h2>
              <article className="request-review-card">
                <div className="request-review-head">
                  <div className="request-review-avatar">{data.review.reviewer_initial}</div>
                  <div>
                    <div className="request-review-author">{data.review.reviewer_name}</div>
                    <div className="request-review-date">{fmtDate(data.review.created_at)}</div>
                  </div>
                </div>
                <div className="request-review-stars">
                  {[1, 2, 3, 4, 5].map((i) =>
                    i <= data.review.rating ? <span key={i}>★</span> : <span key={i}>☆</span>
                  )}
                </div>
                {data.review.comment && (
                  <p className="request-review-comment">{data.review.comment}</p>
                )}
              </article>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  )
}