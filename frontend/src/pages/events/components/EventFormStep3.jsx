import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Search, Save, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { masterApi } from '../../../api/endpoints'
import MclDoctorTable from './MclDoctorTable'
import NonMclDoctorTable from './NonMclDoctorTable'
import DoctorSearchModal from '../../../components/DoctorSearchModal'

export default function EventFormStep3({
  register, saving, getValues, watch,
  doctors, setDoctors, fmvParams,
  eventMeals, setEventMeals,
  doctorSearchOpen, setDoctorSearchOpen,
  addDoctor, onSave, onBack,
}) {
  const [selectedMeal, setSelectedMeal] = useState('')
  const [mealCost, setMealCost] = useState('')

  const { data: mealsMaster = [] } = useQuery({
    queryKey: ['master-meals'],
    queryFn: () => masterApi.meals().then(r => r.data),
  })

  // Calculations
  const emcureAttendees = parseInt(watch?.('proposed_emcure_attendees')) || 0
  const hcpsProfessional = parseInt(watch?.('num_hcps_professional_services')) || 0
  const proposedHcps = parseInt(watch?.('proposed_num_hcps')) || 0
  const totalAttendees = emcureAttendees + hcpsProfessional + proposedHcps
  const totalMealCostPerHead = eventMeals.reduce((sum, m) => sum + (parseFloat(m.cost_per_attendee) || 0), 0)
  const totalMealCost = totalMealCostPerHead * totalAttendees
  const avCost = parseFloat(watch?.('av_platform_cost')) || 0
  const hallCharges = parseFloat(watch?.('venue_charges')) || 0
  const totalEventCost = avCost + hallCharges + totalMealCost

  const addMeal = () => {
    if (!selectedMeal) { toast.error('Select a meal'); return }
    const meal = mealsMaster.find(m => m.name === selectedMeal)
    const cost = parseFloat(mealCost) || 0
    if (meal?.max_cost && cost > meal.max_cost) {
      toast.error(`Cost cannot exceed ₹${Number(meal.max_cost).toLocaleString('en-IN')} for ${meal.name}`)
      return
    }
    setEventMeals(prev => [...prev, { meal_name: selectedMeal, max_cost: meal?.max_cost || null, cost_per_attendee: cost }])
    setSelectedMeal('')
    setMealCost('')
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-5">
        <h3 className="text-lg font-bold">Event Details</h3>

        {/* Row 1: Attendees & HCP counts */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="label">Proposed Number Of Emcure Attendees</label>
            <input type="number" className="input" {...register('proposed_emcure_attendees')} placeholder="0" />
          </div>
          <div>
            <label className="label">Number of HCPs Delivering Professional Services *</label>
            <input type="number" className="input" {...register('num_hcps_professional_services')} placeholder="" />
          </div>
          <div>
            <label className="label">Proposed Number Of HCPs *</label>
            <input type="number" className="input" {...register('proposed_num_hcps')} placeholder="0" />
          </div>
          <div>
            <label className="label">Minimum Guarantee (Pax)</label>
            <input type="number" className="input bg-gray-50" value={totalAttendees} disabled />
          </div>
        </div>

        {/* Row 2: Costs */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="label">Audio/Video & Platform Cost (₹)</label>
            <input type="number" className="input" {...register('av_platform_cost')} placeholder="0" />
          </div>
          <div>
            <label className="label">Hall Charges (₹)</label>
            <input type="number" className="input" {...register('venue_charges')} placeholder="0" />
          </div>
          <div>
            <label className="label">Total Cost For Meals And Beverages (₹)</label>
            <input type="number" className="input bg-gray-50" value={totalMealCost} disabled />
          </div>
          <div>
            <label className="label">Total Event Cost (₹)</label>
            <input type="number" className="input bg-gray-50" value={totalEventCost} disabled />
          </div>
        </div>

        {/* Meals Section */}
        <div className="border-t pt-4">
          <div className="flex gap-3 items-end mb-3">
            <div className="flex-1">
              <label className="label">Meal</label>
              <select className="input" value={selectedMeal} onChange={e => setSelectedMeal(e.target.value)}>
                <option value="">Select meal</option>
                {mealsMaster.map(m => <option key={m.id} value={m.name}>{m.name} {m.max_cost ? `(Max ₹${Number(m.max_cost).toLocaleString('en-IN')})` : ''}</option>)}
              </select>
            </div>
            <div className="w-40">
              <label className="label">Meal Cost</label>
              <input type="number" className="input" value={mealCost} onChange={e => setMealCost(e.target.value)} placeholder="0" />
            </div>
            <button type="button" className="btn-primary bg-red-600 hover:bg-red-700 h-10" onClick={addMeal}>Add</button>
          </div>

          {eventMeals.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Meal</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Max Capping (₹)</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Cost Per Attendee (₹)</th>
                  <th className="px-4 py-2"></th>
                </tr></thead>
                <tbody className="divide-y">
                  {eventMeals.map((m, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-medium">{m.meal_name}</td>
                      <td className="px-4 py-2 text-gray-500">{m.max_cost ? `₹${Number(m.max_cost).toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-4 py-2 font-medium">₹{Number(m.cost_per_attendee || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2 text-right"><button className="text-red-400 hover:text-red-600" onClick={() => setEventMeals(prev => prev.filter((_, idx) => idx !== i))}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Other costs */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="label">Other Amount (₹)</label>
            <input type="number" className="input" {...register('other_amount')} placeholder="0" />
          </div>
          <div>
            <label className="label">Other Amount Description</label>
            <input className="input" {...register('other_amount_description')} placeholder="Mandatory if other amount filled" />
          </div>
          <div>
            <label className="label">BTC Facility</label>
            <select className="input" {...register('btc_facility')}><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></select>
          </div>
        </div>
      </div>

      {/* MCL HCP Section */}
      <div className="card space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">MCL HCP Doctor Details</h3>
          <button type="button" className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-1 text-sm" onClick={() => setDoctorSearchOpen(true)}><Plus size={14} /> Add Doctor</button>
        </div>
        <p className="text-xs text-gray-500">Selection Procedure For MCL HCP</p>
        <MclDoctorTable doctors={doctors} setDoctors={setDoctors} fmvParams={fmvParams} />
      </div>

      {/* Non-MCL HCP Section */}
      <NonMclDoctorTable doctors={doctors} setDoctors={setDoctors} fmvParams={fmvParams} addDoctor={addDoctor} />

      <div className="flex justify-between">
        <button type="button" className="btn-secondary text-red-600 border-red-300" onClick={onBack}>Previous</button>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex items-center gap-1" disabled={saving} onClick={() => onSave(getValues(), false)}><Save size={14} /> Save</button>
          <button type="button" className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => onSave(getValues(), true)}>Next</button>
        </div>
      </div>

      <DoctorSearchModal open={doctorSearchOpen} onClose={() => setDoctorSearchOpen(false)} onSelect={(doc) => {
        addDoctor.mutate({ doctor_name: doc.full_name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim(), specialization: doc.qualification || '', city: doc.city || '', mobile_no: doc.mobile_number || '', pan_number: doc.pan_number || '', email: doc.email || '', fmv_amount: doc.hourly_rate || '', is_mcl: true })
        setDoctorSearchOpen(false)
      }} />
    </div>
  )
}
