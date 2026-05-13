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
      // On error, don't block the user — allow all pages
      set({ accessiblePages: [], loaded: true, loading: false, error: true })
    }
  },

  hasAccess: (pageKey) => {
    const { accessiblePages, loaded, error } = get()
    // If access hasn't loaded yet or fetch failed, allow access (don't block)
    if (!loaded || error) return true
    return accessiblePages.includes(pageKey)
  },

  clearAccess: () => {
    set({ accessiblePages: [], loaded: false, loading: false, error: false })
  },
}))

export default useAccessStore
