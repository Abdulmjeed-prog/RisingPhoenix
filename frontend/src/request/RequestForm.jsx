import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import ImageEditor from '../components/ImageEditor'


const MAX_IMAGES = 5

export default function RequestForm({ editMode = false }) {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    budget_max: '',
    deadline: '',
  })
  const [categories, setCategories] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [existingCaptions, setExistingCaptions] = useState({})
  const [deleteIds, setDeleteIds] = useState([])
  const [newFiles, setNewFiles] = useState([])         // [{file, caption, previewUrl}]
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(editMode)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)
  const [editingIndex, setEditingIndex] = useState(null)
  
  // Load categories (from browse API — reused)
  useEffect(() => {
    api.get('/main/browse/', { params: { page: 1 } })
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setCategories([]))
  }, [])

  // Load existing request for edit mode
  useEffect(() => {
    if (!editMode) return
    api.get(`/requests/${id}/`)
      .then((res) => {
        const r = res.data
        setForm({
          title: r.title || '',
          description: r.description || '',
          category: r.category_id || '',
          budget_max: r.budget_max || '',
          deadline: r.deadline || '',
        })
        setExistingImages(r.images || [])
        const caps = {}
        ;(r.images || []).forEach((img) => { caps[img.id] = img.caption || '' })
        setExistingCaptions(caps)
      })
      .catch(() => setErrors({ detail: t('Unable to load request.') }))
      .finally(() => setLoading(false))
  }, [editMode, id, t])

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleFilesSelected = (files) => {
    const visibleExistingCount = existingImages.length - deleteIds.length
    const available = MAX_IMAGES - visibleExistingCount - newFiles.length
    const list = Array.from(files || []).slice(0, Math.max(0, available))
    const items = list.map((f) => ({
        file: f,
        caption: '',
        previewUrl: URL.createObjectURL(f),
    }))
    setNewFiles((prev) => [...prev, ...items])
    }

  const removeNewFile = (idx) => {
    setNewFiles((prev) => {
      const copy = [...prev]
      URL.revokeObjectURL(copy[idx].previewUrl)
      copy.splice(idx, 1)
      return copy
    })
  }

  const updateNewCaption = (idx, value) => {
    setNewFiles((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, caption: value } : f))
    )
  }

  const toggleDeleteExisting = (imageId) => {
    setDeleteIds((prev) =>
      prev.includes(imageId) ? prev.filter((x) => x !== imageId) : [...prev, imageId]
    )
  }

  const handleAnnotatedSave = (newFile) => {
  setNewFiles((prev) =>
    prev.map((f, i) => {
      if (i !== editingIndex) return f
      URL.revokeObjectURL(f.previewUrl)
      return {
        ...f,
        file: newFile,
        previewUrl: URL.createObjectURL(newFile),
      }
    })
  )
  setEditingIndex(null)
}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)

    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('description', form.description)
    fd.append('category', form.category)
    if (form.budget_max) fd.append('budget_max', form.budget_max)
    if (form.deadline) fd.append('deadline', form.deadline)

    newFiles.forEach((f) => fd.append('images', f.file))
    fd.append('captions', JSON.stringify(newFiles.map((f) => f.caption)))

    if (editMode) {
      fd.append('existing_image_updates', JSON.stringify(existingCaptions))
      fd.append('delete_image_ids', JSON.stringify(deleteIds))
    }

    try {
      const url = editMode ? `/requests/${id}/edit/` : `/requests/new/`
      const { data } = await api.post(url, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate(`/requests/${data.id}`)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') setErrors(data)
      else setErrors({ detail: 'Something went wrong.' })
    } finally {
      setSaving(false)
    }
  }

  const errFor = (field) => errors[field] && (
    <p className="request-error">
      {Array.isArray(errors[field]) ? errors[field].join(' ') : errors[field]}
    </p>
  )

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  const visibleExisting = existingImages.filter((img) => !deleteIds.includes(img.id))

  return (
    <section className="request-shell">
      <div className="request-form-wrap">
        <header className="request-hero">
          <p className="request-eyebrow">
            {editMode ? t('Update Your Idea') : t('Post Your Idea')}
          </p>
          <h1 className="mb-2">
            {editMode ? t('Edit Request') : t('Create a New Request')}
          </h1>
          <p className="request-sub">
            {editMode
              ? t('Refine your details, update budget/timeline, and manage reference images.')
              : t('Share your concept, budget in SAR, and timeline so artisans can submit proposals.')}
          </p>
        </header>

        <div className="request-form-card">
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            {errors.detail && <p className="request-error">{errors.detail}</p>}

            <div className="request-form-grid">
              <div className="field-full">
                <label className="request-label">{t('Title')}</label>
                <input
                  type="text"
                  className="request-input"
                  value={form.title}
                  onChange={update('title')}
                  required
                  maxLength={200}
                />
                {errFor('title')}
              </div>

              <div className="field-full">
                <label className="request-label">{t('Description')}</label>
                <textarea
                  className="request-textarea"
                  rows={6}
                  value={form.description}
                  onChange={update('description')}
                  required
                  minLength={20}
                />
                <p className="desc-char-counter">
                  {form.description.length} {t('characters')}
                </p>
                {errFor('description')}
              </div>

              <div>
                <label className="request-label">{t('Category')}</label>
                <select
                  className="request-input"
                  value={form.category}
                  onChange={update('category')}
                  required
                >
                  <option value="">{t('Select a category')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errFor('category')}
              </div>

              <div>
                <label className="request-label">{t('Deadline')}</label>
                <input
                  type="date"
                  className="request-input"
                  value={form.deadline}
                  onChange={update('deadline')}
                />
                <p className="field-hint">{t('Leave blank for no deadline')}</p>
                {errFor('deadline')}
              </div>

              <div>
                <label className="request-label">{t('Budget (SAR)')}</label>
                <input
                  type="number"
                  step="0.01"
                  className="request-input"
                  value={form.budget_max}
                  onChange={update('budget_max')}
                  min="0"
                />
                <p className="field-hint">{t('Leave blank if flexible')}</p>
                {errFor('budget_max')}
              </div>

              <div className="field-full">
                {editMode && visibleExisting.length > 0 && (
                  <>
                    <p className="request-label">{t('Current images')}</p>
                    <div className="existing-img-grid">
                      {existingImages.map((img) => {
                        const marked = deleteIds.includes(img.id)
                        return (
                          <label
                            key={img.id}
                            className={`existing-img-item ${marked ? 'is-deleted' : ''}`}
                          >
                            <img
                              src={img.url}
                              alt={t('Existing reference image')}
                              style={{ opacity: marked ? 0.4 : 1 }}
                            />
                            <input
                              type="text"
                              className="request-input existing-img-caption"
                              value={existingCaptions[img.id] || ''}
                              onChange={(e) =>
                                setExistingCaptions((prev) => ({
                                  ...prev,
                                  [img.id]: e.target.value,
                                }))
                              }
                              maxLength={160}
                              placeholder={t('Optional note for this image')}
                              disabled={marked}
                            />
                            <span className="existing-img-remove">
                              <input
                                type="checkbox"
                                checked={marked}
                                onChange={() => toggleDeleteExisting(img.id)}
                              />{' '}
                              {t('Remove')}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </>
                )}

                <label className="request-label" htmlFor="request-images">
                  {t('Reference images')}
                </label>
                <div
                  className="img-upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFilesSelected(e.dataTransfer.files)
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="request-images"
                    className="img-upload-input"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                  <p className="img-upload-text">{t('Click or drag images here')}</p>
                  <p className="img-upload-sub">
                    {t('Up to 5 · JPEG, PNG, WebP')}
                  </p>
                </div>

                {newFiles.length > 0 && (
                <>
                    <p className="img-count-badge">
                    {newFiles.length} / {MAX_IMAGES} {t('images')}
                    </p>
                    <div className="img-preview-grid">
                    {newFiles.map((f, idx) => (
                        <div key={idx} className="img-preview-item">
                        <div className="img-preview-left">
                            <img src={f.previewUrl} alt={f.file.name} />
                            <div className="img-preview-actions">
                            <button
                                type="button"
                                className="img-preview-action"
                                onClick={() => setEditingIndex(idx)}
                            >
                                {t('Mark up')}
                            </button>
                            <button
                                type="button"
                                className="img-preview-action img-preview-action-danger"
                                onClick={() => removeNewFile(idx)}
                            >
                                {t('Remove')}
                            </button>
                            </div>
                        </div>
                        <div className="img-preview-right">
                            <p className="img-preview-name">{f.file.name}</p>
                            <textarea
                            className="img-preview-caption"
                            placeholder={t('Add a note — e.g. "change the color of this part"')}
                            maxLength={160}
                            rows={3}
                            value={f.caption}
                            onChange={(e) => updateNewCaption(idx, e.target.value)}
                            />
                        </div>
                        </div>
                    ))}
                    </div>
                </>
                )}
              </div>
            </div>

            <button type="submit" className="request-submit" disabled={saving}>
              {saving
                ? (editMode ? t('Saving...') : t('Posting...'))
                : (editMode ? t('Save changes') : t('Post request'))}
            </button>
          </form>
        </div>
      </div>
      {editingIndex !== null && newFiles[editingIndex] && (
  <ImageEditor
    src={newFiles[editingIndex].previewUrl}
    fileName={newFiles[editingIndex].file.name}
    onSave={handleAnnotatedSave}
    onCancel={() => setEditingIndex(null)}
  />
)}
    </section>
  )
}