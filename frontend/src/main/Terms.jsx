import { useTranslation } from 'react-i18next'

export default function Terms() {
  const { t } = useTranslation()

  return (
    <section className="container-lg py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
            <h1 className="fw-bold mb-4">{t('Terms and Conditions')}</h1>

            <h5 className="fw-bold mt-4">{t('1. Acceptance of Terms')}</h5>
            <p>{t('By using Saaf, you agree to comply with these Terms and Conditions. If you do not agree with any part, you should stop using the platform.')}</p>

            <h5 className="fw-bold mt-4">{t('2. Platform Usage')}</h5>
            <p>{t('Users must use the platform lawfully and responsibly. Any misuse, abuse, or unauthorized access attempt to system components or user data is strictly prohibited.')}</p>

            <h5 className="fw-bold mt-4">{t('3. Accounts and Information')}</h5>
            <p>{t('Each user is responsible for providing accurate registration details, keeping information updated, and protecting account credentials from unauthorized use.')}</p>

            <h5 className="fw-bold mt-4">{t('4. Requests and Transactions')}</h5>
            <p>{t('Saaf facilitates connections between customers and artisans. Both parties are expected to communicate requirements, timelines, and pricing clearly and fairly.')}</p>

            <h5 className="fw-bold mt-4">{t('5. Content and Intellectual Property')}</h5>
            <p>{t('All platform branding, designs, and content are protected by intellectual property rights. Reuse or reproduction without prior permission is not allowed.')}</p>

            <h5 className="fw-bold mt-4">{t('6. Prohibited Conduct')}</h5>
            <p>{t('Fraudulent, abusive, or unlawful content is prohibited. Saaf may suspend or terminate accounts that violate these terms.')}</p>

            <h5 className="fw-bold mt-4">{t('7. Limitation of Liability')}</h5>
            <p>{t('Saaf aims to provide a reliable service but cannot guarantee uninterrupted technical availability at all times. The platform is not liable for damages arising from improper or unauthorized use.')}</p>

            <h5 className="fw-bold mt-4">{t('8. Terms Updates')}</h5>
            <p className="mb-0">{t('Saaf may update these Terms and Conditions at any time. Continued use of the platform after updates means you accept the revised version.')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}