import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { eventsApi, masterApi } from '../../api/endpoints'
import { fmtDate, fmtCurrency } from '../../utils/helpers'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

const PAGE_SIZE = 50

export default function EventList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ['events', statusFilter],
    queryFn: () => eventsApi.list({ status: statusFilter || undefined, limit: 2000 }).then(r => r.data),
  })

  const { data: divisions = [] } = useQuery({
    queryKey: ['master-divisions'],
    queryFn: () => masterApi.divisions().then(r => r.data),
  })

  const divisionMap = Object.fromEntries(divisions.map(d => [d.id, d.name]))

  const filtered = allEvents.filter(e =>
    !search ||
    e.event_title?.toLowerCase().includes(search.toLowerCase()) ||
    e.event_code?.toLowerCase().includes(search.toLowerCase()) ||
    e.city?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const events = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = (val) => {
    setSearch(val)
    setPage(1)
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Events"
        subtitle="Manage medical events, CMEs, conferences and workshops"
        actions={
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/events/new')}>
            <Plus size={16} /> New Event
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by title, code, city…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <select className="input w-40" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          {['Draft','Submitted','Under Review','Approved','Rejected','Completed','Cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {filtered.length !== allEvents.length && (
          <span className="text-sm text-gray-500 self-center">{filtered.length} results</span>
        )}
      </div>

      {isLoading ? <LoadingSpinner /> : allEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description="Create your first event to get started"
          action={<button className="btn-primary" onClick={() => navigate('/events/new')}>Create Event</button>}
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Event Code','Title','Type','Date','Division','Budget','Status',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {events.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/events/${e.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{e.event_code}</td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{e.event_title}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{e.event_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(e.event_date)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{divisionMap[e.division_id] || e.city || '—'}</td>
                  <td className="px-4 py-3 text-xs">{fmtCurrency(e.budget_amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:underline text-xs">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-gray-500">
                Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <button className="btn-secondary py-1 px-2 text-xs" disabled={page===1} onClick={() => setPage(p => p-1)}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`py-1 px-2.5 rounded text-xs ${pg===page ? 'bg-blue-600 text-white' : 'btn-secondary'}`}
                  >{pg}</button>
                ))}
                {totalPages > 8 && <span className="text-xs text-gray-400 self-center px-1">…{totalPages}</span>}
                <button className="btn-secondary py-1 px-2 text-xs" disabled={page===totalPages} onClick={() => setPage(p => p+1)}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
