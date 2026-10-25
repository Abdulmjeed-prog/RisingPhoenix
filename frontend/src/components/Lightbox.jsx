import { useEffect } from 'react'

export default function Lightbox({ src, caption, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!src) return null

  return (
    <div
      className="gallery-lightbox"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <button className="gallery-lightbox-close" onClick={onClose} aria-label="Close">×</button>
      <div className="gallery-lightbox-body">
        <img src={src} alt={caption || ''} />
        {caption && <p className="gallery-lightbox-caption">{caption}</p>}
      </div>
    </div>
  )
}