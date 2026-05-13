import { fmtCurrency } from '../../../utils/helpers'

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  )
}

export default function EventDetailCosts({ event }) {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-3">Event Costs</h3>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Meal Type" value={event.meal_type} />
          <Field label="Meal Cost/Attendee" value={fmtCurrency(event.meal_cost_per_attendee)} />
          <Field label="Min Guarantee (Pax)" value={event.minimum_guarantee_pax} />
          <Field label="Venue Charges" value={fmtCurrency(event.venue_charges)} />
          <Field label="AV/Platform Cost" value={fmtCurrency(event.av_platform_cost)} />
          <Field label="Other Amount" value={fmtCurrency(event.other_amount)} />
          <Field label="BTC Facility" value={event.btc_facility} />
        </div>
        {event.other_amount_description && (
          <div className="mt-3"><Field label="Other Amount Description" value={event.other_amount_description} /></div>
        )}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3">HCPs ({event.doctors?.length || 0})</h3>
        {event.doctors?.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['Name', 'Speciality', 'City', 'PAN', 'Role', 'Rate'].map(h => <th key={h} className="px-3 py-2 text-left text-xs text-gray-500">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {event.doctors.map(d => (
                <tr key={d.id}>
                  <td className="px-3 py-2 font-medium">{d.doctor_name}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{d.specialization || '—'}</td>
                  <td className="px-3 py-2 text-xs">{d.city || '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{d.pan_number || '—'}</td>
                  <td className="px-3 py-2 text-xs">{d.role || '—'}</td>
                  <td className="px-3 py-2 text-xs">{d.fmv_amount ? fmtCurrency(d.fmv_amount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-gray-400">No HCPs added.</p>}
      </div>
    </div>
  )
}
