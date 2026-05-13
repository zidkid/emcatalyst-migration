import { fmtDate } from '../../../utils/helpers'

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  )
}

export default function EventDetailInfo({ event }) {
  return (
    <div className="card space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="On Field Execution By" value={event.on_field_execution_by} />
        <Field label="Proposed Emcure Attendees" value={event.proposed_emcure_attendees} />
        <Field label="Event Start Date" value={fmtDate(event.event_date)} />
        <Field label="Event End Date" value={fmtDate(event.event_end_date)} />
        <Field label="City" value={event.city} />
        <Field label="State" value={event.state} />
        <Field label="Venue" value={event.venue} />
        <Field label="Promotional Material Approved" value={event.promotional_material_approved} />
        <Field label="HCPs Professional Services" value={event.num_hcps_professional_services} />
        <Field label="Proposed HCPs" value={event.proposed_num_hcps} />
      </div>
      {event.rationale && (
        <div><p className="text-xs text-gray-400 mb-0.5">Rationale</p><p className="text-sm bg-gray-50 p-3 rounded">{event.rationale}</p></div>
      )}
      {event.agenda && (
        <div><p className="text-xs text-gray-400 mb-0.5">Agenda</p><p className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">{event.agenda}</p></div>
      )}
    </div>
  )
}
