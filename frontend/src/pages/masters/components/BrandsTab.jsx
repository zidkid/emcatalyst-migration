import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { masterApi } from '../../../api/endpoints'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function BrandsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTA, setNewTA] = useState('')

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['master-brands', search],
    queryFn: () => masterApi.brands(search || undefined).then(r => r.data),
  })

  const create = useMutation({
    mutationFn: () => masterApi.createBrand({ name: newName, therapeutic_area: newTA || undefined }),
    onSuccess: () => {
      qc.invalidateQueries(['master-brands'])
      setShowAdd(false)
      setNewName('')
      setNewTA('')
      toast.success('Brand added')
    },
    onError: () => toast.error('Error adding brand'),
  })

  const toggle = useMutation({
    mutationFn: (b) => masterApi.updateBrand(b.id, { is_active: !b.is_active }),
    onSuccess: () => qc.invalidateQueries(['master-brands']),
  })

  return (
    <div>
      <div className="flex gap-3 items-center mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="input pl-9" placeholder="Search brands…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <p className="text-sm text-gray-500">{brands.length} brands</p>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Brand
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <input className="input flex-1" placeholder="Brand name" value={newName}
            onChange={e => setNewName(e.target.value)} autoFocus />
          <input className="input w-48" placeholder="Therapeutic area" value={newTA}
            onChange={e => setNewTA(e.target.value)} />
          <button className="btn-primary px-3" onClick={() => create.mutate()}><Check size={16} /></button>
          <button className="btn-secondary px-3" onClick={() => setShowAdd(false)}><X size={16} /></button>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Brand Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Therapeutic Area</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {brands.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{b.name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{b.therapeutic_area || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="text-xs text-gray-400 hover:text-gray-700"
                      onClick={() => toggle.mutate(b)}>
                      {b.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
