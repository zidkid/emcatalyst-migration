export default function LoadingSpinner({ size = 'md' }) {
  const sz = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${sz} animate-spin rounded-full border-4 border-[var(--color-primary-100)] border-t-blue-600`} />
    </div>
  )
}
