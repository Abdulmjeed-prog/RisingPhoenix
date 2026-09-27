import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function useLanguage() {
  const { i18n } = useTranslation()
  const [lang, setLang] = useState(i18n.language || 'en')

  useEffect(() => {
    const handler = (lng) => setLang(lng)
    i18n.on('languageChanged', handler)
    return () => i18n.off('languageChanged', handler)
  }, [i18n])

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', lang)
    localStorage.setItem('saaf-lang', lang)

    // Swap Bootstrap CSS to match direction
    const link = document.getElementById('bootstrap-css')
    if (link) {
      const file = lang === 'ar' ? 'bootstrap.rtl.min.css' : 'bootstrap.min.css'
      link.href = '/bootstrap/' + file
    }
  }, [lang])

  const toggle = () => {
    const next = lang === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(next)
  }

  return { lang, toggle }
}