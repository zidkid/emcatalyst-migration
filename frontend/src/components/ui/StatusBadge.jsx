import { statusBadgeClass } from '../../utils/helpers'

export default function StatusBadge({ status }) {
  if (!status) return null
  const displayText = status.replace(/_/g, ' ')
  return (
    <span className={statusBadgeClass(status)}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          opacity: 0.7,
          flexShrink: 0,
        }}
      />
      {displayText}
    </span>
  )
}
