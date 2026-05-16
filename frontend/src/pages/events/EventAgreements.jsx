import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FileSignature, FileDown, Loader2, ChevronDown, ChevronUp, ScrollText } from 'lucide-react'
import { eventsApi } from '../../api/endpoints'
import { fmtDate, fmtCurrency } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const AGREEMENT_STATUS_COLORS = {
  'Not Required': 'bg-gray-100 text-gray-500',
  'Not Initiated': 'bg-amber-100 text-amber-700',
  'Pending': 'bg-blue-100 text-blue-700',
  'Signed': 'bg-emerald-100 text-emerald-700',
  'Generated': 'bg-teal-100 text-teal-700',
  'Manually Uploaded': 'bg-purple-100 text-purple-700',
  'Cancelled': 'bg-red-100 text-red-600',
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function truncateText(text, maxLen = 80) {
  if (!text) return '—'
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

export default function EventAgreements() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'Administrator' || user?.is_superuser
  const [docLogsDoctor, setDocLogsDoctor] = useState(null)
  const [docLogs, setDocLogs] = useState([])
  const [docLogsLoading, setDocLogsLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['event-agreements', id],
    queryFn: async () => {
      // First sync statuses for pending agreements
      try { await eventsApi.syncAgreementStatuses(id) } catch {}
      // Then fetch the latest data
      return eventsApi.agreementsStatus(id).then(r => r.data)
    },
  })

  const generateMutation = useMutation({
    mutationFn: (doctorId) => eventsApi.generateAgreement(id, doctorId),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Agreement generated successfully')
      queryClient.invalidateQueries({ queryKey: ['event-agreements', id] })
      queryClient.invalidateQueries({ queryKey: ['agreement-api-logs', id] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to generate agreement')
    },
  })

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>
  if (!data) return <div className="p-8 text-red-500">Event not found</div>

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/events')} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileSignature size={20} className="text-purple-600" />
            HCP Agreements
          </h1>
          <p className="text-sm text-gray-500">{data.event_code} — {data.event_title}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sub App Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">HCP Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Agreement Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.agreements.map(a => (
              <tr key={a.doctor_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-primary)]">{a.sub_application_code || '—'}</td>
                <td className="px-4 py-3 font-medium">{a.doctor_name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{a.email || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{a.agreement_date ? formatDateTime(a.agreement_date) : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AGREEMENT_STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-500'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {a.status === 'Not Initiated' && (
                    <button
                      onClick={() => generateMutation.mutate(a.doctor_id)}
                      disabled={generateMutation.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {generateMutation.isPending && generateMutation.variables === a.doctor_id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <FileDown size={12} />
                      )}
                      Generate
                    </button>
                  )}
                  {a.file_path && (a.status === 'Pending' || a.status === 'Signed' || a.status === 'Generated') && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await eventsApi.downloadAgreement(id, a.doctor_id)
                          const url = window.URL.createObjectURL(new Blob([res.data]))
                          const link = document.createElement('a')
                          link.href = url
                          link.setAttribute('download', `agreement_${a.sub_application_code || a.doctor_id}.pdf`)
                          document.body.appendChild(link)
                          link.click()
                          link.remove()
                          window.URL.revokeObjectURL(url)
                        } catch (err) {
                          toast.error('Failed to download agreement')
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <FileDown size={12} />
                      {a.status === 'Signed' ? 'Download Signed' : 'Download'}
                    </button>
                  )}
                  {(a.status === 'Pending' || a.status === 'Signed' || a.status === 'Cancelled') && (
                    <button
                      onClick={async () => {
                        setDocLogsDoctor(a)
                        setDocLogsLoading(true)
                        try {
                          const res = await eventsApi.agreementDocLogs(id, a.doctor_id)
                          setDocLogs(res.data || [])
                        } catch { setDocLogs([]) }
                        setDocLogsLoading(false)
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <ScrollText size={12} /> Logs
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {data.agreements.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No HCPs in this event</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Document Logs Modal */}
      {docLogsDoctor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDocLogsDoctor(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-800">Document Logs</h3>
                <p className="text-xs text-gray-500">{docLogsDoctor.sub_application_code} — {docLogsDoctor.doctor_name}</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600 text-lg font-bold" onClick={() => setDocLogsDoctor(null)}>✕</button>
            </div>
            <div className="px-5 py-4 overflow-y-auto max-h-[55vh]">
              {docLogsLoading ? <LoadingSpinner /> : docLogs.length === 0 ? (
                <p className="text-center text-gray-400 py-6">No logs found</p>
              ) : (
                <div className="space-y-3">
                  {docLogs.map((log, i) => (
                    <div key={i} className="flex gap-3 items-start border-l-2 border-gray-200 pl-3 py-1">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{log.Action}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{log.UserEmail}</span>
                          <span>{log.DateTime ? formatDateTime(log.DateTime) : '—'}</span>
                        </div>
                        {log.IPAddress && <p className="text-xs text-gray-400 mt-0.5">IP: {log.IPAddress}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API Logs Section - Admin Only */}
      {isAdmin && <AgreementApiLogs eventId={id} />}
    </div>
  )
}

function AgreementApiLogs({ eventId }) {
  const [expanded, setExpanded] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)

  const { data: logs, isLoading } = useQuery({
    queryKey: ['agreement-api-logs', eventId],
    queryFn: () => eventsApi.agreementApiLogs(eventId).then(r => r.data),
    enabled: expanded,
  })

  return (
    <div className="mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-3"
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        API Logs ({expanded && logs ? logs.length : '…'})
      </button>

      {expanded && (
        <div className="card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-6"><LoadingSpinner /></div>
          ) : logs && logs.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doctor ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Request</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Response</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Performed By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date/Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3 font-medium text-xs">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.doctor_id || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        log.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono max-w-[150px]">
                      {expandedRow === log.id ? (
                        <pre className="whitespace-pre-wrap text-[11px] bg-gray-50 p-2 rounded border max-h-40 overflow-auto">{log.request_payload}</pre>
                      ) : (
                        truncateText(log.request_payload, 50)
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono max-w-[150px]">
                      {expandedRow === log.id ? (
                        <pre className="whitespace-pre-wrap text-[11px] bg-gray-50 p-2 rounded border max-h-40 overflow-auto">{log.response_payload}</pre>
                      ) : (
                        truncateText(log.response_payload, 50)
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.performed_by}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-400 text-sm">No API logs recorded yet</div>
          )}
        </div>
      )}
    </div>
  )
}
