export default function NotificationBell() {
  return (
    <span className="saaf-bell-wrap">
      <button
        type="button"
        className="btn btn-saaf-outline rounded-pill d-inline-flex align-items-center justify-content-center position-relative saaf-bell-btn"
        aria-label="Notifications"
      >
        <i className="bi bi-bell"></i>
      </button>
    </span>
  )
}