import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function PasswordResetDone() {
  const { t } = useTranslation()

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-md-5 text-center">
              <h2 className="fw-bold mb-3">{t('Check Your Email')}</h2>
              <p className="text-muted mb-4">
                {t("We've emailed you instructions for setting your password. If an account exists with the email you entered, you should receive the message shortly.")}
              </p>
              <Link to="/login" className="btn btn-primary rounded-pill px-4">
                {t('Back to Login')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}