import { Navigate } from 'react-router-dom'
import useAccessStore from '../store/accessStore'
import LoadingSpinner from './ui/LoadingSpinner'

const PAGE_ROUTES = {
  dashboard: '/',
  events_list: '/events',
  brs_list: '/brs',
  masters: '/masters',
  masters_entities: '/masters/entities',
  masters_divisions: '/masters/divisions',
  masters_doctors: '/masters/doctors',
  masters_brands: '/masters/brands',
  masters_therapeutics: '/masters/therapeutics',
  masters_document_types: '/masters/document-types',
  masters_meals: '/masters/meals',
  masters_fmv_parameters: '/masters/fmv-parameters',
  masters_budget: '/masters/budget',
  reports_events: '/reports/events',
  reports_cme_events: '/reports/cme-events',
  reports_fmv_parameters: '/reports/fmv-parameters',
  users: '/users',
  hierarchy: '/hierarchy',
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
