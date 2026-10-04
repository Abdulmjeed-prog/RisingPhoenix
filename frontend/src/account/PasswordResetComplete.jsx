import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function PasswordResetComplete() {
  const { t } = useTranslation()

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-md-5 text-center">
              <h2 className="fw-bold mb-3">{t('Password Updated')}</h2>
              <p className="text-muted mb-4">
                {t('Your password has been set successfully. You can now log in with your new password.')}
              </p>
              <Link to="/login" className="btn btn-primary rounded-pill px-4">
                {t('Go to Login')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}