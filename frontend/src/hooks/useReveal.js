import { useEffect } from 'react'

/**
 * Adds the `is-visible` class to every `.saaf-reveal` element once it enters
 * the viewport. Re-runs whenever a dependency changes (e.g., after data loads).
 */
export default function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll('.saaf-reveal')
    if (!els.length) return

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.14 }
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}