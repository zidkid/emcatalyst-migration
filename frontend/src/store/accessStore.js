import { create } from 'zustand'
import api from '../api/client'

const useAccessStore = create((set, get) => ({
  accessiblePages: [],
  loaded: false,
  loading: false,
  error: false,

  fetchAccess: async () => {
    if (get().loading) return
    set({ loading: true, error: false })
    try {
      const res = await api.get('/rbac/access/me')
      set({ accessiblePages: res.data.pages || [], loaded: true, loading: false })
    } catch (err) {
      console.error('Failed to fetch access:', err)
      // On error, deny access — don't open all gates
      set({ accessiblePages: ['dashboard'], loaded: true, loading: false, error: true })
    }
  },

  hasAccess: (pageKey) => {
    const { accessiblePages, loaded, error } = get()
    // If not loaded yet, deny (caller should show loading state)
    if (!loaded) return false
    // On error, only allow dashboard
    if (error) return pageKey === 'dashboard'
    return accessiblePages.includes(pageKey)
  },

  clearAccess: () => {
    set({ accessiblePages: [], loaded: false, loading: false, error: false })
  },
}))

export default useAccessStore
