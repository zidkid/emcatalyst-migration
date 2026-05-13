import { ChevronLeft, Save } from 'lucide-react'

export default function EventFormStep2({
  register, handleSubmit, saving, eventCode,
  isCME, isAdvisory, onSave, onBack,
}) {
  return (
    <form onSubmit={handleSubmit(d => onSave(d, true))} className="card space-y-5">
      <h3 className="text-lg font-bold">Event Details</h3>

      {/* Row 1: Event Code, On Field Execution, Promotional Material */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Event Code</label>
          <input className="input bg-gray-50" value={eventCode || 'Auto-generated'} disabled />
        </div>
        <div>
          <label className="label">On Field Execution By * (i)</label>
          <input className="input" {...register('on_field_execution_by', { required: true })} />
        </div>
        <div>
          <label className="label">Promotional Material & Contents Approved?</label>
          <select className="input" {...register('promotional_material_approved')}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>

      {/* Row 2: Dates, City, Venue */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="label">Event Start Date *</label>
          <input type="date" className="input" {...register('event_date', { required: true })} />
        </div>
        <div>
          <label className="label">Event End Date *</label>
          <input type="date" className="input" {...register('event_end_date', { required: true })} />
        </div>
        <div>
          <label className="label">City *</label>
          <input className="input" {...register('city', { required: true })} />
        </div>
        <div>
          <label className="label">Venue * (i)</label>
          <input className="input" {...register('venue', { required: true })} />
        </div>
      </div>

      {/* Row 3: Rationale, Agenda */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Rationale * (i)</label>
          <textarea className="input h-20" {...register('rationale', { required: true })} placeholder="Provide rationale" />
        </div>
        <div>
          <label className="label">Agenda * (i)</label>
          <textarea className="input h-20" {...register('agenda', { required: true })} placeholder="Event agenda" />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" className="btn-secondary text-red-600 border-red-300" onClick={onBack}>Previous</button>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex items-center gap-1" disabled={saving} onClick={handleSubmit(d => onSave(d, false))}><Save size={14} /> Save</button>
          <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700" disabled={saving}>Next</button>
        </div>
      </div>
    </form>
  )
}
