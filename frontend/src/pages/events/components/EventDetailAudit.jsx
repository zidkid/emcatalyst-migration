import { Clock } from 'lucide-react'
import { fmtDate } from '../../../utils/helpers'
import StatusBadge from '../../../components/ui/StatusBadge'

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  )
}

export default function EventDetailAudit({ event }) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Approval History</h3>
      {event.audit_trail?.length > 0 ? (
        <div className="space-y-0">
          {event.audit_trail.map((entry, i) => (
            <div key={entry.id || i} className="flex gap-4 pb-4 relative">
              {i < event.audit_trail.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200" />}
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 z-10">
                <Clock size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                  {entry.to_status && <StatusBadge status={entry.to_status} />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  by <span className="font-medium">{entry.performed_by}</span>
                  {entry.created_at && ` • ${fmtDate(entry.created_at)}`}
                </p>
                {entry.remarks && <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">{entry.remarks}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No audit trail entries yet.</p>
      )}

      {/* Approver info */}
      <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4">
        <Field label="L1 Approver" value={event.l1_approver_name ? `${event.l1_approver_name}${event.l1_approved_at ? ' ✓' : ''}` : 'Not assigned'} />
        <Field label="L2 Approver" value={event.l2_approver_name ? `${event.l2_approver_name}${event.l2_approved_at ? ' ✓' : ''}` : 'Not assigned'} />
        {event.l1_approved_at && <Field label="L1 Approved At" value={fmtDate(event.l1_approved_at)} />}
        {event.l2_approved_at && <Field label="L2 Approved At" value={fmtDate(event.l2_approved_at)} />}
        {event.compliance_approved_at && <Field label="Compliance Approved At" value={fmtDate(event.compliance_approved_at)} />}
      </div>
    </div>
  )
}
