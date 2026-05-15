import { Bell } from 'lucide-react'
import useAuthStore from '../../store/authStore'

export default function Topbar() {
  const { user } = useAuthStore()
  const initials = (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-6"
      style={{
        height: 'var(--topbar-height)',
        background: '#fff',
        borderBottom: '1px solid var(--color-neutral-200)',
        boxShadow: '0 2px 10px rgba(33,35,38,.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span
          className="font-extrabold text-xl tracking-tight"
          style={{ color: 'var(--color-primary)' }}
        >
          EMCatalyst
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--color-neutral-500)' }}>
          Emcure Pharmaceuticals
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center rounded-full border transition-all hover:border-primary"
          style={{
            width: 34, height: 34,
            borderColor: 'var(--color-neutral-300)',
          }}
          title="Notifications"
        >
          <Bell size={16} style={{ color: 'var(--color-neutral-600)' }} />
          {/* Badge dot */}
          <span
            className="absolute flex items-center justify-center text-white font-bold"
            style={{
              width: 16, height: 16, fontSize: 9,
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
              top: -5, right: -5,
            }}
          >
            3
          </span>
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center text-white font-bold"
          style={{
            width: 32, height: 32,
            background: 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
          }}
          title={`${user?.first_name} ${user?.last_name}`}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
