import { Navigate } from 'react-router-dom'
import useAccessStore from '../store/accessStore'
import LoadingSpinner from './ui/LoadingSpinner'

const PAGE_ROUTES = {
  dashboard: '/',
  events_list: '/events',
  approvals_list: '/approvals',
  vendors_list: '/vendors',
  promotional_list: '/promotional',
  brs_list: '/brs',
  masters: '/masters',
  reports: '/reports',
  access_management: '/access',
  users: '/users',
  hierarchy: '/hierarchy',
  agreements_list: '/agreements',
  admin_rbac: '/admin/rbac',
  admin_workflows: '/admin/workflows',
  brs_bulk_upload: '/brs/bulk-upload',
}

/**
 * Route guard that checks RBAC page access.
 * Wrap existing route elements with this component.
 */
export default function ProtectedRoute({ pageKey, children }) {
  const { accessiblePages, loaded, loading, error } = useAccessStore()

  // Show loading spinner while RBAC is being fetched
  if (!loaded && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  // On error, redirect to a limited-access state
  if (error && pageKey !== 'dashboard') {
    return <Navigate to="/" replace />
  }

  // If loaded but user doesn't have access
  if (loaded && !accessiblePages.includes(pageKey)) {
    for (const pk of Object.keys(PAGE_ROUTES)) {
      if (accessiblePages.includes(pk)) {
        return <Navigate to={PAGE_ROUTES[pk]} replace />
      }
    }
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
