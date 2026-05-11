import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Building2 } from 'lucide-react'
import { vendorsApi } from '../../api/endpoints'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

export default function VendorList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors', search],
    queryFn: () => vendorsApi.list({ search: search || undefined, limit: 200 }).then(r => r.data),
  })

  return (
    <div className="p-8">
      <PageHeader
        title="Vendor Master"
        subtitle="Manage SAP vendor / supplier master data"
        actions={
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/vendors/new')}>
            <Plus size={16} /> Add Vendor
          </button>
        }
      />
      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input className="input pl-9" placeholder="Search by LIFNR, name, PAN…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? <LoadingSpinner /> : vendors.length === 0 ? (
        <EmptyState icon={Building2} title="No vendors found" description="Add your first vendor from SAP or manually" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['LIFNR','Name','City','PAN','GSTIN','Account Group','Status',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendors.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/vendors/${v.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{v.lifnr}</td>
                  <td className="px-4 py-3 font-medium">{v.name1}{v.name2 && <span className="text-gray-400"> / {v.name2}</span>}</td>
                  <td className="px-4 py-3 text-gray-500">{v.ort01}</td>
                  <td className="px-4 py-3 font-mono text-xs">{v.pan_no || v.j_1ipanno || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{v.gstin || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{v.ktokk || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={v.is_active ? 'badge-active' : 'badge-rejected'}>{v.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3"><button className="text-blue-600 text-xs hover:underline">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
