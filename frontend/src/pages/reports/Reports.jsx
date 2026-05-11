import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../api/endpoints'
import { fmtDate, fmtCurrency } from '../../utils/helpers'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#003087', '#c8102e', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#f97316']

const TABS = [
  'Events Report',
  'Division-wise',
  'State-wise',
  'Event Type-wise',
  'Finance Allocation',
  'CME / Honorarium',
  'HCP Agreements',
  'Audit Trail',
]

function DateFilters({ fromDate, toDate, setFromDate, setToDate }) {
  return (
    <div className="flex gap-3 mb-6">
      <div>
        <label className="label text-xs">From Date</label>
        <input type="date" className="input w-40" value={fromDate} onChange={e => setFromDate(e.target.value)} />
      </div>
      <div>
        <label className="label text-xs">To Date</label>
        <input type="date" className="input w-40" value={toDate} onChange={e => setToDate(e.target.value)} />
      </div>
    </div>
  )
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState(0)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const params = {
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
  }

  const { data: eventsData = [], isLoading: evLoading } = useQuery({
    queryKey: ['report-events', params],
    queryFn: () => reportsApi.events(params).then(r => r.data),
    enabled: activeTab === 0,
  })
  const { data: divisionData = [], isLoading: divLoading } = useQuery({
    queryKey: ['report-division', params],
    queryFn: () => reportsApi.divisionWise(params).then(r => r.data),
    enabled: activeTab === 1,
  })
  const { data: stateData = [], isLoading: stateLoading } = useQuery({
    queryKey: ['report-state', params],
    queryFn: () => reportsApi.stateWise(params).then(r => r.data),
    enabled: activeTab === 2,
  })
  const { data: typeData = [], isLoading: typeLoading } = useQuery({
    queryKey: ['report-type', params],
    queryFn: () => reportsApi.eventTypeWise(params).then(r => r.data),
    enabled: activeTab === 3,
  })
  const { data: financeData = [], isLoading: finLoading } = useQuery({
    queryKey: ['report-finance', params],
    queryFn: () => reportsApi.financeAllocation(params).then(r => r.data),
    enabled: activeTab === 4,
  })
  const { data: cmeData = [], isLoading: cmeLoading } = useQuery({
    queryKey: ['report-cme', params],
    queryFn: () => reportsApi.cmeEvents(params).then(r => r.data),
    enabled: activeTab === 5,
  })
  const { data: honorariumData = [], isLoading: honorLoading } = useQuery({
    queryKey: ['report-honorarium', params],
    queryFn: () => reportsApi.hcpHonorarium(params).then(r => r.data),
    enabled: activeTab === 6,
  })
  const { data: auditData = [], isLoading: auditLoading } = useQuery({
    queryKey: ['report-audit', params],
    queryFn: () => reportsApi.auditTrail({ limit: 100 }).then(r => r.data),
    enabled: activeTab === 7,
  })

  const statusCounts = eventsData.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  return (
    <div className="p-8">
      <PageHeader title="Reports" subtitle="Analytics and compliance reports" />

      <DateFilters fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} />

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-6 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === i ? 'border-emcure-blue text-emcure-blue' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Events Report */}
      {activeTab === 0 && (
        evLoading ? <LoadingSpinner /> : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-semibold mb-4">Events by Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="font-semibold mb-4">Budget vs Actual (Top 10)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={eventsData.filter(e => e.budget_amount > 0).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="event_code" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => fmtCurrency(v)} />
                    <Bar dataKey="budget_amount" fill="#003087" name="Budget" />
                    <Bar dataKey="actual_amount" fill="#c8102e" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-2">{eventsData.length} events</div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Code','Title','Type','Date','Status','Budget','Actual'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y">{eventsData.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{e.event_code}</td>
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{e.event_title}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{e.event_type || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(e.event_date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3 text-xs">{fmtCurrency(e.budget_amount)}</td>
                    <td className="px-4 py-3 text-xs">{fmtCurrency(e.actual_amount)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Division-wise */}
      {activeTab === 1 && (
        divLoading ? <LoadingSpinner /> : (
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold mb-4">Events per Division</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={divisionData.filter(d => d.event_count > 0)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="division_name" tick={{ fontSize: 10 }} width={160} />
                  <Tooltip />
                  <Bar dataKey="event_count" fill="#003087" name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Division','Total Events','Approved','Completed','Total Budget','Total Actual'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y">{divisionData.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.division_name}</td>
                    <td className="px-4 py-3">{d.event_count}</td>
                    <td className="px-4 py-3">{d.approved_count}</td>
                    <td className="px-4 py-3">{d.completed_count}</td>
                    <td className="px-4 py-3 text-xs">{fmtCurrency(d.total_budget)}</td>
                    <td className="px-4 py-3 text-xs">{fmtCurrency(d.total_actual)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* State-wise */}
      {activeTab === 2 && (
        stateLoading ? <LoadingSpinner /> : (
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold mb-4">Events by State</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stateData.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="state" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="event_count" fill="#10b981" name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['State','Event Count','Total Budget','Total Actual'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y">{stateData.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.state}</td>
                    <td className="px-4 py-3">{s.event_count}</td>
                    <td className="px-4 py-3 text-xs">{fmtCurrency(s.total_budget)}</td>
                    <td className="px-4 py-3 text-xs">{fmtCurrency(s.total_actual)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Event Type-wise */}
      {activeTab === 3 && (
        typeLoading ? <LoadingSpinner /> : (
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold mb-4">Events by Type</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={typeData} dataKey="event_count" nameKey="event_type" cx="50%" cy="50%" outerRadius={90} label={({ event_type, event_count }) => `${event_type} (${event_count})`}>
                    {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Event Type','Count','Total Budget','Total Actual'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y">{typeData.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{t.event_type}</td>
                    <td className="px-4 py-3">{t.event_count}</td>
                    <td className="px-4 py-3 text-xs">{fmtCurrency(t.total_budget)}</td>
                    <td className="px-4 py-3 text-xs">{fmtCurrency(t.total_actual)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Finance */}
      {activeTab === 4 && (
        finLoading ? <LoadingSpinner /> : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Serial No','Vendor','Date','Amount','IGST','TDS','Net','Status','SAP Doc'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">{financeData.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{f.serial_no}</td>
                  <td className="px-4 py-3 font-medium">{f.vendor_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(f.document_date)}</td>
                  <td className="px-4 py-3 text-xs">{fmtCurrency(f.amount)}</td>
                  <td className="px-4 py-3 text-xs">{fmtCurrency(f.igst)}</td>
                  <td className="px-4 py-3 text-xs text-red-600">{fmtCurrency(f.tds)}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{fmtCurrency(f.net)}</td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{f.sap_doc_no || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )
      )}

      {/* CME */}
      {activeTab === 5 && (
        cmeLoading ? <LoadingSpinner /> : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Doctor Name','Session Type','Honorarium','TDS','Net Payable','Payment Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">{cmeData.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.doctor_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.session_type}</td>
                  <td className="px-4 py-3 text-xs">{fmtCurrency(c.honorarium_amount)}</td>
                  <td className="px-4 py-3 text-xs text-red-600">{fmtCurrency(c.tds_amount)}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{fmtCurrency(c.net_payable)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.payment_status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )
      )}

      {/* HCP Agreements / Honorarium */}
      {activeTab === 6 && (
        honorLoading ? <LoadingSpinner /> : (
          <div>
            <div className="text-sm text-gray-500 mb-3">{honorariumData.length} agreement records</div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Event Code','Event Title','Event Date','Doctor Name','PAN','MCL','Status','Hourly Rate','Max Cap'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y">{honorariumData.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-mono text-xs text-blue-600">{r.event_code}</td>
                    <td className="px-3 py-2.5 font-medium max-w-xs truncate text-xs">{r.event_title}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{fmtDate(r.event_date)}</td>
                    <td className="px-3 py-2.5 font-medium text-xs">{r.doctor_name || '—'}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.pan_number || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${r.is_mcl ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {r.is_mcl ? 'MCL' : 'Non-MCL'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-3 py-2.5 text-xs text-right">{r.hourly_rate ? fmtCurrency(r.hourly_rate) : '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-right">{r.max_capping ? fmtCurrency(r.max_capping) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Audit */}
      {activeTab === 7 && (
        auditLoading ? <LoadingSpinner /> : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Entity','ID','Action','Field','Old Value','New Value','By','At'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">{auditData.map((a, i) => (
                <tr key={i} className="hover:bg-gray-50 text-xs">
                  <td className="px-4 py-3">{a.entity_type}</td>
                  <td className="px-4 py-3">{a.entity_id}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.action} /></td>
                  <td className="px-4 py-3 text-gray-500">{a.field_name}</td>
                  <td className="px-4 py-3 text-red-600 font-mono">{a.old_value || '—'}</td>
                  <td className="px-4 py-3 text-emerald-600 font-mono">{a.new_value || '—'}</td>
                  <td className="px-4 py-3">{a.changed_by_id}</td>
                  <td className="px-4 py-3 text-gray-400">{fmtDate(a.changed_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
