import useAccessStore from '../store/accessStore'

/**
 * Hook to check page access for the current user.
 * Usage: const { hasAccess } = useAccess()
 *        if (hasAccess('brs_list')) { ... }
 */
export default function useAccess() {
  const accessiblePages = useAccessStore((s) => s.accessiblePages)
  const loaded = useAccessStore((s) => s.loaded)
  const error = useAccessStore((s) => s.error)

  const hasAccess = (pageKey) => {
    // Don't block if not loaded or errored (graceful degradation)
    if (!loaded || error) return true
    return accessiblePages.includes(pageKey)
  }

  return { hasAccess, loaded, accessiblePages }
}
