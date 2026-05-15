export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-neutral-900)' }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', marginTop: 4 }}>{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
