import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Megaphone } from 'lucide-react'
import { promotionalApi } from '../../api/endpoints'
import { fmtDate, fmtCurrency } from '../../utils/helpers'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

export default function PromotionalList() {
  const navigate = useNavigate()
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['promotional'],
    queryFn: () => promotionalApi.list({ limit: 100 }).then(r => r.data),
  })

  return (
    <div className="p-8">
      <PageHeader
        title="Promotional Events"
        subtitle="Manage marketing and promotional activities budget"
        actions={<button className="btn-primary flex items-center gap-2" onClick={() => navigate('/promotional/new')}><Plus size={16} /> New Promo Event</button>}
      />
      {isLoading ? <LoadingSpinner /> : events.length === 0 ? (
        <EmptyState icon={Megaphone} title="No promotional events" action={<button className="btn-primary" onClick={() => navigate('/promotional/new')}>Create Promo Event</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Code','Title','Type','Month/Year','Budget','Actual Spend','Status','Valid',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {events.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/promotional/${e.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{e.event_code}</td>
                  <td className="px-4 py-3 font-medium">{e.event_title}</td>
                  <td className="px-4 py-3 text-gray-500">{e.event_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(e.month_and_year)}</td>
                  <td className="px-4 py-3">{fmtCurrency(e.total_budget)}</td>
                  <td className="px-4 py-3">{fmtCurrency(e.actual_spend)}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3"><span className={e.is_valid ? 'badge-active' : 'badge-rejected'}>{e.is_valid ? 'Valid' : 'Invalid'}</span></td>
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
