import { fmtCurrency } from '../../../utils/helpers'

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  )
}

export default function EventDetailBasic({ event }) {
  return (
    <div className="card space-y-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Initiated by</p>
        <p className="text-sm font-medium">{event.initiator_name || '—'} ({event.initiator_employee_id || '—'})</p>
        <p className="text-xs text-gray-500">{event.initiator_designation || ''}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Event Type" value={event.event_type} />
        <Field label="Division" value={event.division_id} />
        <Field label="Therapeutic Area" value={event.therapeutic_area} />
        <Field label="Brand" value={event.brand} />
        <Field label="Budget Type" value={event.budget_type} />
        <Field label="Platform" value={event.platform} />
        <Field label="Topic" value={event.topic} />
        {event.event_type === 'Corporate Sponsorship' && (<>
          <Field label="Conference Type" value={event.conference_type} />
          <Field label="Solicited/Unsolicited" value={event.solicited_unsolicited} />
          <Field label="Sponsorship Type" value={event.sponsorship_type} />
          <Field label="Sponsorship Amount" value={fmtCurrency(event.sponsorship_amount)} />
          <Field label="Advance Payment" value={event.advance_payment ? 'Yes' : 'No'} />
          {event.advance_payment && <Field label="Advance Amount" value={fmtCurrency(event.advance_payment_amount)} />}
          {event.advance_payment_reason && <Field label="Advance Reason" value={event.advance_payment_reason} />}
        </>)}
      </div>
    </div>
  )
}
