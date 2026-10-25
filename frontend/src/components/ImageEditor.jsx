import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function ImageEditor({ src, fileName, onSave, onCancel }) {
  const { t } = useTranslation()
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const drawingRef = useRef(false)
  const currentPointsRef = useRef([])

  const [strokeColor, setStrokeColor] = useState('#e53935')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [highlightMode, setHighlightMode] = useState(false)
  const [strokes, setStrokes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const colors = ['#e53935', '#ff9800', '#ffeb3b', '#43a047', '#1e88e5', '#1c1712']

  // Load image and set canvas size to fit
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const maxW = Math.min(canvas.parentElement.clientWidth - 24, 900)
      const maxH = 500
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1)
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      imageRef.current = img
      setLoading(false)
    }
    img.src = src
  }, [src])

  // Redraw canvas whenever strokes change (undo/clear/save)
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')

    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    strokes.forEach((s) => {
      if (s.points.length < 2) return
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y)
      }
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.width
      ctx.globalAlpha = s.highlight ? 0.35 : 1
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    })
    ctx.globalAlpha = 1
  }, [strokes, loading])

  const getPoint = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const handlePointerDown = (e) => {
    if (loading) return
    e.preventDefault()
    drawingRef.current = true
    currentPointsRef.current = [getPoint(e)]
    canvasRef.current.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return
    const pt = getPoint(e)
    currentPointsRef.current.push(pt)

    // Live draw the current segment
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pts = currentPointsRef.current
    if (pts.length < 2) return
    ctx.beginPath()
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y)
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.globalAlpha = highlightMode ? 0.35 : 1
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  const handlePointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const pts = currentPointsRef.current
    if (pts.length >= 2) {
      setStrokes((prev) => [
        ...prev,
        { points: pts, color: strokeColor, width: strokeWidth, highlight: highlightMode },
      ])
    }
    currentPointsRef.current = []
  }

  const handleUndo = () => setStrokes((prev) => prev.slice(0, -1))
  const handleClear = () => setStrokes([])

  const handleSave = async () => {
    setSaving(true)
    try {
      const canvas = canvasRef.current
      const img = imageRef.current

      // Export at original image resolution
      const outCanvas = document.createElement('canvas')
      outCanvas.width = img.width
      outCanvas.height = img.height
      const ctx = outCanvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const sx = img.width / canvas.width
      const sy = img.height / canvas.height

      strokes.forEach((s) => {
        if (s.points.length < 2) return
        ctx.beginPath()
        ctx.moveTo(s.points[0].x * sx, s.points[0].y * sy)
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x * sx, s.points[i].y * sy)
        }
        ctx.strokeStyle = s.color
        ctx.lineWidth = s.width * ((sx + sy) / 2)
        ctx.globalAlpha = s.highlight ? 0.35 : 1
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
      })
      ctx.globalAlpha = 1

      const blob = await new Promise((resolve) =>
        outCanvas.toBlob((b) => resolve(b), 'image/png', 0.92)
      )
      const baseName = (fileName || 'image').replace(/\.[^.]+$/, '')
      const newFile = new File([blob], `${baseName}-annotated.png`, { type: 'image/png' })
      onSave(newFile)
    } catch (err) {
      console.error(err)
      alert(t('Could not save the annotated image.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="image-editor-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="image-editor-card">
        <div className="image-editor-head">
          <p className="mb-0">{t('Mark Up Image')}</p>
          <button
            type="button"
            className="image-editor-close"
            onClick={onCancel}
            aria-label={t('Close')}
          >
            ×
          </button>
        </div>

        <p className="image-editor-hint">
          {t('Draw or highlight the parts you want changed. Annotations are saved with the image.')}
        </p>

        <div className="image-editor-controls">
          <div className="editor-tool-group">
            <button
              type="button"
              className={`editor-tool-btn ${!highlightMode ? 'is-active' : ''}`}
              onClick={() => setHighlightMode(false)}
            >
              ✎ {t('Draw')}
            </button>
            <button
              type="button"
              className={`editor-tool-btn ${highlightMode ? 'is-active' : ''}`}
              onClick={() => setHighlightMode(true)}
            >
              ▢ {t('Highlight')}
            </button>
          </div>

          <div className="editor-color-group">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                className={`editor-color-swatch ${strokeColor === c ? 'is-active' : ''}`}
                style={{ background: c }}
                onClick={() => setStrokeColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          <div className="editor-tool-group">
            <button
              type="button"
              className={`editor-tool-btn ${strokeWidth === 3 ? 'is-active' : ''}`}
              onClick={() => setStrokeWidth(3)}
            >
              {t('Thin')}
            </button>
            <button
              type="button"
              className={`editor-tool-btn ${strokeWidth === 7 ? 'is-active' : ''}`}
              onClick={() => setStrokeWidth(7)}
            >
              {t('Thick')}
            </button>
          </div>
        </div>

        <div className="image-editor-canvas-wrap">
          <div id="image-editor-host" style={{ position: 'relative' }}>
            {loading && <p className="text-center text-muted py-4">{t('Loading image...')}</p>}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: 'none', cursor: 'crosshair', maxWidth: '100%', display: loading ? 'none' : 'block' }}
            />
          </div>
        </div>

        <div className="image-editor-toolbar">
          <button
            type="button"
            className="image-editor-btn image-editor-btn-primary"
            onClick={handleSave}
            disabled={saving || strokes.length === 0}
          >
            {saving ? t('Saving...') : t('Save Edits')}
          </button>
          <button
            type="button"
            className="image-editor-btn"
            onClick={handleUndo}
            disabled={strokes.length === 0}
          >
            {t('Undo')}
          </button>
          <button
            type="button"
            className="image-editor-btn"
            onClick={handleClear}
            disabled={strokes.length === 0}
          >
            {t('Clear All')}
          </button>
          <button type="button" className="image-editor-btn" onClick={onCancel}>
            {t('Cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}