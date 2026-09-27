export default function DefaultAvatarPicker({ value, onChange }) {
  const avatars = ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png', 'avatar5.png', 'avatar6.png']

  return (
    <div className="d-flex flex-wrap gap-3">
      {avatars.map((a) => (
        <label key={a} className="default-avatar-option text-center">
          <input
            type="radio"
            name="default_avatar"
            value={a}
            className="d-none"
            checked={value === a}
            onChange={() => onChange(a)}
          />
          <img
            src={`/images/avatars/defaults/${a}`}
            alt="Default avatar"
            className={`rounded-circle border shadow-sm default-avatar-preview ${
              value === a ? 'border-primary border-3' : ''
            }`}
            style={{ width: 72, height: 72, objectFit: 'cover', cursor: 'pointer' }}
          />
        </label>
      ))}
    </div>
  )
}