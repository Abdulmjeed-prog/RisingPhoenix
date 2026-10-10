import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'

export function useStripeStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/stripe/status/')
      setStatus(data)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const startOnboarding = async () => {
    setStarting(true)
    try {
      const { data } = await api.post('/auth/stripe/connect/')
      // Full page redirect to Stripe
      window.location.href = data.url
    } catch (err) {
      setStarting(false)
      throw err
    }
  }

  return { status, loading, starting, refresh, startOnboarding }
}