import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useSidebar } from '../hooks/useSidebar'

export default function Sidebar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { collapsed, toggle, collapse } = useSidebar()
  const location = useLocation()

  // Only render for authenticated users (matches Django template)
  if (!user) return null

  const isStaff = user.is_staff
  const isArtisan = user.is_artisan

  // Helper: is the current route this path?
  const isActive = (path) => location.pathname === path

  // Helper: render one sidebar button
  const SidebarBtn = ({ to, icon, label, active, extraClass = '' }) => (
    <Link
      to={to}
      className={`sidebar-btn ${active ? 'sidebar-btn-active' : ''} ${extraClass}`}
      aria-label={label}
      title={label}
    >
      <i className={icon}></i>
      {active && <span className="sidebar-active-indicator"></span>}
    </Link>
  )

  return (
    <>
      {/* Main toggle — visible when collapsed, click to expand */}
      <button
        type="button"
        className={`saaf-sidebar-toggle ${collapsed ? '' : 'hidden'}`}
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
        onClick={toggle}
      >
        <i className="bi bi-chevron-right"></i>
      </button>

      <aside className={`saaf-sidebar ${collapsed ? 'collapsed' : ''}`} id="saaf-sidebar-main">
        {/* Mini toggle — visible when expanded, click to collapse */}
        <button
          type="button"
          className={`saaf-sidebar-mini-toggle ${collapsed ? 'hidden' : ''}`}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          onClick={collapse}
        >
          <i className="bi bi-chevron-left"></i>
        </button>

        <p className="sidebar-label">{t('My Space')}</p>

        {/* Staff-only */}
        {isStaff && (
          <SidebarBtn
            to="/staff"
            icon="bi bi-shield-lock"
            label={t('Staff Dashboard')}
            active={isActive('/staff')}
          />
        )}

        {isArtisan ? (
          <>
            {/* ── Artisan links ── */}
            <SidebarBtn
              to="/artisan/dashboard"
              icon="bi bi-grid-1x2-fill"
              label={t('Artisan Dashboard')}
              active={isActive('/artisan/dashboard')}
            />
            <SidebarBtn
              to="/proposals"
              icon="bi bi-send"
              label={t('My Proposals')}
              active={isActive('/proposals')}
            />
            <SidebarBtn
              to="/messages"
              icon="bi bi-chat-dots"
              label={t('Messages')}
              active={isActive('/messages')}
            />
          </>
        ) : (
          <>
            {/* ── Customer links ── */}
            <SidebarBtn
              to="/dashboard"
              icon="bi bi-grid-1x2-fill"
              label={t('Dashboard')}
              active={isActive('/dashboard')}
            />
            <SidebarBtn
              to="/my-requests"
              icon="bi bi-file-text"
              label={t('My Requests')}
              active={isActive('/my-requests')}
            />
            <SidebarBtn
              to="/messages"
              icon="bi bi-chat-dots"
              label={t('Messages')}
              active={isActive('/messages')}
            />

            <div className="sidebar-divider"></div>

            <SidebarBtn
              to="/requests/new"
              icon="bi bi-plus-lg"
              label={t('Post New Request')}
              active={isActive('/requests/new')}
              extraClass="sidebar-btn-new"
            />
          </>
        )}

        <div className="sidebar-divider"></div>

        {/* Role-specific profile/workshop link */}
        {isStaff ? (
          <SidebarBtn
            to="/staff/profile"
            icon="bi bi-person-circle"
            label={t('Profile')}
            active={isActive('/staff/profile')}
          />
        ) : isArtisan ? (
          <SidebarBtn
            to={`/workshop/${user.id}`}
            icon="bi bi-shop"
            label={t('My Workshop')}
            active={location.pathname.startsWith('/workshop/')}
          />
        ) : null}

        {/* Profile link — for both artisan and regular users */}
        {(isArtisan || user.profile) && !isStaff && (
          <SidebarBtn
            to={`/profile/${user.username}`}
            icon="bi bi-person-circle"
            label={t('Profile')}
            active={isActive(`/profile/${user.username}`)}
          />
        )}
      </aside>
    </>
  )
}