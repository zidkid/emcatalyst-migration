import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText } from 'lucide-react'
import { agreementsApi } from '../../api/endpoints'
import { fmtDate, fmtCurrency } from '../../utils/helpers'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

export default function AgreementList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementsApi.list({ limit: 100 }).then(r => r.data),
  })

  const filtered = agreements.filter(a =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.party_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <PageHeader
        title="Agreements"
        subtitle="Manage vendor and service agreements"
        actions={<button className="btn-primary flex items-center gap-2" onClick={() => navigate('/agreements/new')}><Plus size={16} /> New Agreement</button>}
      />
      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input className="input pl-9" placeholder="Search agreements…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No agreements" action={<button className="btn-primary" onClick={() => navigate('/agreements/new')}>New Agreement</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['No.','Title','Type','Party','Start','End','Value','Status',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/agreements/${a.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-primary)]">{a.agreement_no}</td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{a.title}</td>
                  <td className="px-4 py-3 text-gray-500">{a.agreement_type || '—'}</td>
                  <td className="px-4 py-3">{a.party_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(a.start_date)}</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(a.end_date)}</td>
                  <td className="px-4 py-3">{fmtCurrency(a.value)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3"><button className="text-[var(--color-primary)] text-xs hover:underline">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
