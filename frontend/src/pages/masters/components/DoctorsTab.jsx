import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { masterApi } from '../../../api/endpoints'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import Modal from '../../../components/ui/Modal'

const PAGE_SIZE = 50

export default function DoctorsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ full_name: '', first_name: '', last_name: '', qualification: '', email: '', pan_number: '', city: '', state: '', mobile_number: '', doctor_type: '', hourly_rate: '', max_capping: '' })

  const { data: states = [] } = useQuery({
    queryKey: ['master-states'],
    queryFn: () => masterApi.states().then(r => r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['doctors-all', search, stateFilter, page],
    queryFn: () => masterApi.hcpDoctorsAll({
      q: search || undefined,
      state: stateFilter || undefined,
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    }).then(r => r.data),
  })

  const doctors = Array.isArray(data) ? data : []

  const createDoctor = useMutation({
    mutationFn: () => {
      const payload = {}
      for (const [k, v] of Object.entries(addForm)) { if (v) payload[k] = v }
      if (!payload.full_name) payload.full_name = `${payload.first_name || ''} ${payload.last_name || ''}`.trim()
      return masterApi.createHcpDoctor(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries(['doctors-all'])
      setShowAdd(false)
      setAddForm({ full_name: '', first_name: '', last_name: '', qualification: '', email: '', pan_number: '', city: '', state: '', mobile_number: '', doctor_type: '', hourly_rate: '', max_capping: '' })
      toast.success('Doctor added')
    },
    onError: () => toast.error('Error adding doctor'),
  })

  const deleteDoctor = useMutation({
    mutationFn: (id) => masterApi.deleteHcpDoctor(id),
    onSuccess: () => { qc.invalidateQueries(['doctors-all']); toast.success('Doctor deleted') },
    onError: () => toast.error('Error deleting'),
  })

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, PAN, email, city…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input w-48" value={stateFilter} onChange={e => { setStateFilter(e.target.value); setPage(1) }}>
          <option value="">All States</option>
          {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Doctor
        </button>
      </div>

      {/* Add Doctor Form */}
      {showAdd && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <p className="text-sm font-medium text-blue-800">Add New MCL Doctor</p>
          <div className="grid grid-cols-4 gap-3">
            <input className="input" placeholder="First Name *" value={addForm.first_name} onChange={e => setAddForm(p => ({...p, first_name: e.target.value}))} />
            <input className="input" placeholder="Last Name" value={addForm.last_name} onChange={e => setAddForm(p => ({...p, last_name: e.target.value}))} />
            <input className="input" placeholder="Qualification" value={addForm.qualification} onChange={e => setAddForm(p => ({...p, qualification: e.target.value}))} />
            <input className="input" placeholder="Doctor Type" value={addForm.doctor_type} onChange={e => setAddForm(p => ({...p, doctor_type: e.target.value}))} />
            <input className="input" placeholder="Email" value={addForm.email} onChange={e => setAddForm(p => ({...p, email: e.target.value}))} />
            <input className="input" placeholder="PAN Number" value={addForm.pan_number} onChange={e => setAddForm(p => ({...p, pan_number: e.target.value}))} />
            <input className="input" placeholder="Mobile" value={addForm.mobile_number} onChange={e => setAddForm(p => ({...p, mobile_number: e.target.value}))} />
            <input className="input" placeholder="City" value={addForm.city} onChange={e => setAddForm(p => ({...p, city: e.target.value}))} />
            <input className="input" placeholder="State" value={addForm.state} onChange={e => setAddForm(p => ({...p, state: e.target.value}))} />
            <input type="number" className="input" placeholder="Hourly Rate (₹)" value={addForm.hourly_rate} onChange={e => setAddForm(p => ({...p, hourly_rate: e.target.value}))} />
            <input type="number" className="input" placeholder="Max Capping (₹)" value={addForm.max_capping} onChange={e => setAddForm(p => ({...p, max_capping: e.target.value}))} />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary text-sm" onClick={() => createDoctor.mutate()}>Save Doctor</button>
            <button className="btn-secondary text-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'PAN', 'Qualification', 'City/State', 'Mobile', 'Type', 'Hourly Rate', 'Max Cap', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {doctors.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{d.full_name || [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs text-blue-600">{d.pan_number || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{d.qualification || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{[d.city, d.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{d.mobile_number || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{d.doctor_type || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    {d.hourly_rate ? `₹${Number(d.hourly_rate).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {d.max_capping ? `₹${Number(d.max_capping).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button className="text-xs text-blue-600 hover:underline" onClick={() => setSelectedDoc(d)}>
                        <Edit2 size={12} />
                      </button>
                      <button className="text-xs text-red-500 hover:underline" onClick={(ev) => { ev.stopPropagation(); if (confirm('Delete this doctor?')) deleteDoctor.mutate(d.id) }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {doctors.length === PAGE_SIZE && (
            <div className="flex justify-between items-center px-4 py-3 border-t text-sm text-gray-500">
              <span>Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + doctors.length}</span>
              <div className="flex gap-2">
                <button className="btn-secondary py-1 px-3 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <button className="btn-secondary py-1 px-3 text-xs" onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Doctor detail/edit modal */}
      <Modal open={!!selectedDoc} onClose={() => setSelectedDoc(null)} title="Edit Doctor" size="md">
        {selectedDoc && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Full Name</label><input className="input" value={selectedDoc.full_name || ''} onChange={e => setSelectedDoc(p => ({...p, full_name: e.target.value}))} /></div>
              <div><label className="label">PAN Number</label><input className="input" value={selectedDoc.pan_number || ''} onChange={e => setSelectedDoc(p => ({...p, pan_number: e.target.value}))} /></div>
              <div><label className="label">Qualification</label><input className="input" value={selectedDoc.qualification || ''} onChange={e => setSelectedDoc(p => ({...p, qualification: e.target.value}))} /></div>
              <div><label className="label">Doctor Type</label><input className="input" value={selectedDoc.doctor_type || ''} onChange={e => setSelectedDoc(p => ({...p, doctor_type: e.target.value}))} /></div>
              <div><label className="label">City</label><input className="input" value={selectedDoc.city || ''} onChange={e => setSelectedDoc(p => ({...p, city: e.target.value}))} /></div>
              <div><label className="label">State</label><input className="input" value={selectedDoc.state || ''} onChange={e => setSelectedDoc(p => ({...p, state: e.target.value}))} /></div>
              <div><label className="label">Mobile</label><input className="input" value={selectedDoc.mobile_number || ''} onChange={e => setSelectedDoc(p => ({...p, mobile_number: e.target.value}))} /></div>
              <div><label className="label">Email</label><input className="input" value={selectedDoc.email || ''} onChange={e => setSelectedDoc(p => ({...p, email: e.target.value}))} /></div>
              <div><label className="label">Hourly Rate (₹)</label><input type="number" className="input" value={selectedDoc.hourly_rate || ''} onChange={e => setSelectedDoc(p => ({...p, hourly_rate: e.target.value}))} /></div>
              <div><label className="label">Max Capping (₹)</label><input type="number" className="input" value={selectedDoc.max_capping || ''} onChange={e => setSelectedDoc(p => ({...p, max_capping: e.target.value}))} /></div>
              <div><label className="label">Bank Name</label><input className="input" value={selectedDoc.bank_name || ''} onChange={e => setSelectedDoc(p => ({...p, bank_name: e.target.value}))} /></div>
              <div><label className="label">Account Number</label><input className="input" value={selectedDoc.account_number || ''} onChange={e => setSelectedDoc(p => ({...p, account_number: e.target.value}))} /></div>
              <div><label className="label">IFSC Code</label><input className="input" value={selectedDoc.ifsc_code || ''} onChange={e => setSelectedDoc(p => ({...p, ifsc_code: e.target.value}))} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button className="btn-secondary" onClick={() => setSelectedDoc(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                const data = {}
                for (const [k, v] of Object.entries(selectedDoc)) {
                  if (k !== 'id' && k !== 'mendix_id' && k !== 'is_active' && k !== 'name_as_per_bank' && k !== 'hml' && v !== null && v !== undefined) data[k] = v
                }
                masterApi.updateHcpDoctor(selectedDoc.id, data).then(() => {
                  qc.invalidateQueries(['doctors-all'])
                  setSelectedDoc(null)
                  toast.success('Doctor updated')
                }).catch(() => toast.error('Error updating'))
              }}>Save Changes</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
