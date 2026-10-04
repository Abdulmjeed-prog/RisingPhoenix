import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import 'bootstrap-icons/font/bootstrap-icons.css'

import './styles/main.css'
import './styles/style.css'
import './styles/notification.css'
import './styles/progress.css'
import './styles/proposal.css'
import './styles/request.css'
import './styles/dashboard.css'
import './styles/artisan-dashboard.css'
import './i18n'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
