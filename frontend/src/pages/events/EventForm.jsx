import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { eventsApi, accessApi, masterApi } from '../../api/endpoints'
import PageHeader from '../../components/ui/PageHeader'
import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react'

const STEPS = ['Basic Info', 'Doctors / HCPs', 'Event Costs', 'Documents', 'Review & Submit']

export default function EventForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [eventId, setEventId] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [costs, setCosts] = useState([])
  const { register, handleSubmit, getValues, formState: { errors } } = useForm()

  const { data: divisions = [] } = useQuery({ queryKey: ['divisions'], queryFn: () => accessApi.listDivisions().then(r => r.data) })
  const { data: eventTypes = [] } = useQuery({ queryKey: ['eventTypes'], queryFn: () => masterApi.eventTypes().then(r => r.data) })

  const createEvent = useMutation({
    mutationFn: (data) => eventsApi.create(data),
    onSuccess: (res) => {
      setEventId(res.data.id)
      setStep(1)
      toast.success('Event created. Now add doctors.')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error creating event'),
  })

  const addDoctor = useMutation({
    mutationFn: (data) => eventsApi.addDoctor(eventId, data),
    onSuccess: (res) => {
      setDoctors(prev => [...prev, res.data])
      toast.success('Doctor added')
    },
  })

  const addCost = useMutation({
    mutationFn: (data) => eventsApi.addCost(eventId, data),
    onSuccess: (res) => {
      setCosts(prev => [...prev, res.data])
      toast.success('Cost added')
    },
  })

  const submitEvent = useMutation({
    mutationFn: () => eventsApi.submit(eventId),
    onSuccess: () => {
      qc.invalidateQueries(['events'])
      toast.success('Event submitted for approval!')
      navigate('/events')
    },
  })

  const [doctorForm, setDoctorForm] = useState({ doctor_name: '', specialization: '', mobile_no: '', pan_number: '', fmv_amount: '' })
  const [costForm, setCostForm] = useState({ cost_head: '', estimated_amount: '', vendor_name: '' })

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title="New Event" subtitle="Create a new medical event or CME" />

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emcure-blue text-white' : 'bg-gray-200 text-gray-500'
            }`}>{i + 1}</div>
            <span className={`text-sm ${i === step ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 0: Basic Info */}
      {step === 0 && (
        <form onSubmit={handleSubmit(d => createEvent.mutate(d))} className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Event Title *</label>
              <input className="input" {...register('event_title', { required: true })} placeholder="E.g., Cardiology CME - Mumbai" />
            </div>
            <div>
              <label className="label">Event Type *</label>
              <select className="input" {...register('event_type', { required: true })}>
                <option value="">Select type</option>
                {eventTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Division</label>
              <select className="input" {...register('division_id')}>
                <option value="">Select division</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Event Date</label>
              <input type="datetime-local" className="input" {...register('event_date')} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="datetime-local" className="input" {...register('event_end_date')} />
            </div>
            <div className="col-span-2">
              <label className="label">Venue</label>
              <input className="input" {...register('venue')} placeholder="Hotel / Hospital / Online" />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" {...register('city')} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" {...register('state')} />
            </div>
            <div>
              <label className="label">Budget (INR)</label>
              <input type="number" className="input" {...register('budget_amount')} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Cost Center</label>
              <input className="input" {...register('cost_center')} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={createEvent.isPending}>
              {createEvent.isPending ? 'Saving…' : 'Save & Continue →'}
            </button>
          </div>
        </form>
      )}

      {/* Step 1: Doctors */}
      {step === 1 && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Add Doctors / HCPs</h3>
          <div className="grid grid-cols-3 gap-3">
            <input className="input" placeholder="Doctor Name *" value={doctorForm.doctor_name} onChange={e => setDoctorForm(p => ({...p, doctor_name: e.target.value}))} />
            <input className="input" placeholder="Specialization" value={doctorForm.specialization} onChange={e => setDoctorForm(p => ({...p, specialization: e.target.value}))} />
            <input className="input" placeholder="Mobile No" value={doctorForm.mobile_no} onChange={e => setDoctorForm(p => ({...p, mobile_no: e.target.value}))} />
            <input className="input" placeholder="PAN Number" value={doctorForm.pan_number} onChange={e => setDoctorForm(p => ({...p, pan_number: e.target.value}))} />
            <input type="number" className="input" placeholder="FMV Amount (INR)" value={doctorForm.fmv_amount} onChange={e => setDoctorForm(p => ({...p, fmv_amount: e.target.value}))} />
            <button className="btn-primary flex items-center gap-1" onClick={() => { addDoctor.mutate(doctorForm); setDoctorForm({ doctor_name:'', specialization:'', mobile_no:'', pan_number:'', fmv_amount:'' }) }}>
              <Plus size={14} /> Add
            </button>
          </div>
          {doctors.length > 0 && (
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50"><tr>{['Name','Specialization','Mobile','PAN','FMV'].map(h => <th key={h} className="px-3 py-2 text-left text-xs text-gray-500">{h}</th>)}</tr></thead>
              <tbody>{doctors.map((d,i) => <tr key={i} className="border-t"><td className="px-3 py-2">{d.doctor_name}</td><td className="px-3 py-2">{d.specialization}</td><td className="px-3 py-2">{d.mobile_no}</td><td className="px-3 py-2">{d.pan_number}</td><td className="px-3 py-2">{d.fmv_amount}</td></tr>)}</tbody>
            </table>
          )}
          <div className="flex justify-between pt-2">
            <button className="btn-secondary" onClick={() => setStep(0)}><ChevronLeft size={16} /> Back</button>
            <button className="btn-primary" onClick={() => setStep(2)}>Continue <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Step 2: Costs */}
      {step === 2 && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Event Costs</h3>
          <div className="grid grid-cols-3 gap-3">
            <input className="input" placeholder="Cost Head *" value={costForm.cost_head} onChange={e => setCostForm(p => ({...p, cost_head: e.target.value}))} />
            <input type="number" className="input" placeholder="Estimated Amount" value={costForm.estimated_amount} onChange={e => setCostForm(p => ({...p, estimated_amount: e.target.value}))} />
            <input className="input" placeholder="Vendor Name" value={costForm.vendor_name} onChange={e => setCostForm(p => ({...p, vendor_name: e.target.value}))} />
          </div>
          <button className="btn-primary flex items-center gap-1 w-fit" onClick={() => { addCost.mutate(costForm); setCostForm({ cost_head:'', estimated_amount:'', vendor_name:'' }) }}>
            <Plus size={14} /> Add Cost
          </button>
          {costs.length > 0 && (
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50"><tr>{['Cost Head','Amount','Vendor'].map(h => <th key={h} className="px-3 py-2 text-left text-xs text-gray-500">{h}</th>)}</tr></thead>
              <tbody>{costs.map((c,i) => <tr key={i} className="border-t"><td className="px-3 py-2">{c.cost_head}</td><td className="px-3 py-2">₹{c.estimated_amount}</td><td className="px-3 py-2">{c.vendor_name}</td></tr>)}</tbody>
            </table>
          )}
          <div className="flex justify-between pt-2">
            <button className="btn-secondary" onClick={() => setStep(1)}><ChevronLeft size={16} /> Back</button>
            <button className="btn-primary" onClick={() => setStep(3)}>Continue <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Step 3: Documents */}
      {step === 3 && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Upload Documents</h3>
          <p className="text-sm text-gray-500">Upload invitation letter, agenda, attendance sheet, etc.</p>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
            Document upload available after event is saved.<br />
            Proceed to submit the event first, then attach documents.
          </div>
          <div className="flex justify-between pt-2">
            <button className="btn-secondary" onClick={() => setStep(2)}><ChevronLeft size={16} /> Back</button>
            <button className="btn-primary" onClick={() => setStep(4)}>Continue <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Review & Submit</h3>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-2">Event Summary</p>
            <p>{doctors.length} doctor(s) added • {costs.length} cost line(s)</p>
          </div>
          <p className="text-sm text-gray-600">
            By submitting, the event will be sent for Compliance and Finance approval.
          </p>
          <div className="flex justify-between pt-2">
            <button className="btn-secondary" onClick={() => setStep(3)}><ChevronLeft size={16} /> Back</button>
            <button className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={() => submitEvent.mutate()} disabled={submitEvent.isPending}>
              {submitEvent.isPending ? 'Submitting…' : '✓ Submit for Approval'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
