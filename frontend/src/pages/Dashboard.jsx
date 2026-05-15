import useAuthStore from '../store/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.first_name || 'User'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's what's happening in Catalyst today.
        </p>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'New Event', href: '/events/new', color: 'bg-[var(--color-primary-50)] text-[var(--color-primary)] border-[var(--color-primary-100)]' },
            { label: 'BRS', href: '/brs', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          ].map(({ label, href, color }) => (
            <a
              key={href}
              href={href}
              className={`border rounded-lg px-4 py-3 text-sm font-medium text-center hover:opacity-80 transition-opacity ${color}`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
