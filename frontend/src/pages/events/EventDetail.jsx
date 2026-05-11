import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { eventsApi, eventAgreementsApi, masterApi } from '../../api/endpoints'
import { fmtDate, fmtCurrency } from '../../utils/helpers'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import FmvCalculator from '../../components/FmvCalculator'
import DoctorSearchModal from '../../components/DoctorSearchModal'
import {
  ArrowLeft, CheckCircle, XCircle, Plus, Trash2, FileSignature, UserCheck
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const TABS = ['Overview', 'Doctors & HCPs', 'Agreements', 'Costs', 'Documents']

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [tab, setTab] = useState('Overview')
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [addAgreementModal, setAddAgreementModal] = useState(false)
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [fmvDoctorModal, setFmvDoctorModal] = useState(false)
  const [fmvDoctor, setFmvDoctor] = useState(null)
  const [nonMclForm, setNonMclForm] = useState({ name: '', pan: '', email: '' })

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id).then(r => r.data),
  })

  const { data: agreements = [] } = useQuery({
    queryKey: ['event-agreements', id],
    queryFn: () => eventAgreementsApi.list(id).then(r => r.data),
    enabled: !!id,
  })

  const approve = useMutation({
    mutationFn: (remarks) => eventsApi.approve(id, remarks),
    onSuccess: () => { qc.invalidateQueries(['event', id]); toast.success('Event approved') },
  })
  const reject = useMutation({
    mutationFn: (reason) => eventsApi.reject(id, reason),
    onSuccess: () => { qc.invalidateQueries(['event', id]); setRejectModal(false); toast.success('Event rejected') },
  })

  const createAgreement = useMutation({
    mutationFn: (data) => eventAgreementsApi.create(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['event-agreements', id])
      setAddAgreementModal(false)
      setSelectedDoctor(null)
      setNonMclForm({ name: '', pan: '', email: '' })
      toast.success('Agreement created')
    },
  })

  const updateAgreementStatus = useMutation({
    mutationFn: ({ agreementId, status, remark }) =>
      eventAgreementsApi.updateStatus(id, agreementId, status, remark),
    onSuccess: () => { qc.invalidateQueries(['event-agreements', id]); toast.success('Agreement updated') },
  })

  const deleteAgreement = useMutation({
    mutationFn: (agreementId) => eventAgreementsApi.delete(id, agreementId),
    onSuccess: () => { qc.invalidateQueries(['event-agreements', id]); toast.success('Agreement deleted') },
  })

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>
  if (!event) return <div className="p-8 text-red-500">Event not found</div>

  const canApprove = ['Administrator', 'ComplianceUser', 'FinanceUser'].includes(user?.role) && event.status === 'Submitted'

  const handleAddAgreement = () => {
    const data = selectedDoctor
      ? { doctor_id: selectedDoctor.id, is_hcp_doctor: true }
      : {
          non_mcl_name: nonMclForm.name,
          non_mcl_pan: nonMclForm.pan,
          non_mcl_email: nonMclForm.email,
          is_hcp_doctor: false,
        }
    createAgreement.mutate(data)
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/events')} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <PageHeader
          title={event.event_title}
          subtitle={`${event.event_code} • ${event.event_type || 'Event'}`}
          actions={
            <div className="flex gap-2">
              {canApprove && (
                <>
                  <button
                    className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1"
                    onClick={() => approve.mutate()}
                  >
                    <CheckCircle size={15} /> Approve
                  </button>
                  <button
                    className="btn-danger flex items-center gap-1"
                    onClick={() => setRejectModal(true)}
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </>
              )}
              <StatusBadge status={event.status} />
            </div>
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
            {t === 'Agreements' && agreements.length > 0 && (
              <span className="ml-1.5 bg-blue-100 text-blue-700 rounded-full text-xs px-1.5 py-0.5">
                {agreements.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            ['Event Date', fmtDate(event.event_date)],
            ['End Date', fmtDate(event.event_end_date)],
            ['Venue', event.venue || '—'],
            ['City', event.city || '—'],
            ['State', event.state || '—'],
            ['Budget', fmtCurrency(event.budget_amount)],
            ['Actual Cost', fmtCurrency(event.actual_amount)],
            ['Cost Center', event.cost_center || '—'],
            ['Expected Attendance', event.expected_attendance || '—'],
            ['Actual Attendance', event.actual_attendance || '—'],
            ['Event Category', event.event_category || '—'],
            ['Status', event.status],
          ].map(([label, value]) => (
            <div key={label} className="card py-3 px-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="font-medium text-sm">{value}</p>
            </div>
          ))}
          {event.compliance_remarks && (
            <div className="card col-span-3 py-3 px-4 bg-blue-50">
              <p className="text-xs text-gray-400 mb-1">Compliance Remarks</p>
              <p className="text-sm">{event.compliance_remarks}</p>
            </div>
          )}
          {event.rejection_reason && (
            <div className="card col-span-3 py-3 px-4 bg-red-50">
              <p className="text-xs text-red-400 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{event.rejection_reason}</p>
            </div>
          )}
        </div>
      )}

      {/* Doctors & HCPs Tab */}
      {tab === 'Doctors & HCPs' && (
        <div className="space-y-4">
          {event.doctors?.length > 0 ? (
            <div className="card">
              <h3 className="font-semibold mb-3">Doctors / HCPs ({event.doctors.length})</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Qualification', 'Specialization', 'City', 'PAN', 'FMV', 'Action'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {event.doctors.map(d => (
                    <tr key={d.id}>
                      <td className="px-3 py-2 font-medium">{d.doctor_name}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{d.qualification}</td>
                      <td className="px-3 py-2 text-gray-500">{d.specialization}</td>
                      <td className="px-3 py-2">{d.city}</td>
                      <td className="px-3 py-2 font-mono text-xs">{d.pan_number}</td>
                      <td className="px-3 py-2">{fmtCurrency(d.fmv_amount)}</td>
                      <td className="px-3 py-2">
                        <button
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => { setFmvDoctor(null); setFmvDoctorModal(true) }}
                        >
                          FMV Calc
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400">
              No doctors added to this event yet.
            </div>
          )}
        </div>
      )}

      {/* Agreements Tab */}
      {tab === 'Agreements' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Agreements are generated post-event for each participating HCP/doctor.
            </p>
            <button
              className="btn-primary flex items-center gap-1.5 text-sm"
              onClick={() => setAddAgreementModal(true)}
            >
              <Plus size={15} /> Add Agreement
            </button>
          </div>

          {agreements.length === 0 ? (
            <div className="card p-8 text-center">
              <FileSignature size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">No agreements yet. Add agreements for HCPs who participated in this event.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Doctor / HCP', 'Type', 'PAN', 'Agreement Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agreements.map(ag => (
                    <tr key={ag.id}>
                      <td className="px-4 py-3 font-medium">
                        {ag.is_hcp_doctor
                          ? (ag.doctor_name || `Doctor #${ag.doctor_id}`)
                          : (ag.non_mcl_name || 'Non-MCL HCP')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          ag.is_hcp_doctor ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {ag.is_hcp_doctor ? 'MCL Doctor' : 'Non-MCL HCP'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {ag.is_hcp_doctor ? ag.doctor_pan : ag.non_mcl_pan}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {ag.agreement_date ? fmtDate(ag.agreement_date) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ag.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {ag.status === 'Pending' && canApprove && (
                            <>
                              <button
                                className="text-xs text-emerald-600 hover:underline"
                                onClick={() => updateAgreementStatus.mutate({ agreementId: ag.id, status: 'Approved' })}
                              >
                                Approve
                              </button>
                              <button
                                className="text-xs text-red-500 hover:underline"
                                onClick={() => updateAgreementStatus.mutate({ agreementId: ag.id, status: 'Cancelled' })}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            className="text-xs text-gray-400 hover:text-red-500"
                            onClick={() => deleteAgreement.mutate(ag.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Costs Tab */}
      {tab === 'Costs' && (
        <div>
          {event.costs?.length > 0 ? (
            <div className="card">
              <h3 className="font-semibold mb-3">Event Costs</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Cost Head', 'Vendor', 'Estimated', 'Actual'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {event.costs.map(c => (
                    <tr key={c.id}>
                      <td className="px-3 py-2 font-medium">{c.cost_head}</td>
                      <td className="px-3 py-2 text-gray-500">{c.vendor_name}</td>
                      <td className="px-3 py-2">{fmtCurrency(c.estimated_amount)}</td>
                      <td className="px-3 py-2">{fmtCurrency(c.actual_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400">No costs recorded.</div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'Documents' && (
        <div className="card p-8 text-center text-gray-400">
          Document upload functionality available when creating/editing event.
        </div>
      )}

      {/* Reject Modal */}
      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Reject Event">
        <div className="space-y-4">
          <div>
            <label className="label">Reason for Rejection *</label>
            <textarea
              className="input h-24"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Please provide a reason…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setRejectModal(false)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={() => reject.mutate(rejectReason)}
              disabled={!rejectReason}
            >
              Reject Event
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Agreement Modal */}
      <Modal
        open={addAgreementModal}
        onClose={() => { setAddAgreementModal(false); setSelectedDoctor(null); setNonMclForm({ name: '', pan: '', email: '' }) }}
        title="Add Agreement"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`border-2 rounded-lg p-3 text-left transition-colors ${
                selectedDoctor !== null
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
              onClick={() => { setDoctorSearchOpen(true) }}
            >
              <div className="flex items-center gap-2 mb-1">
                <UserCheck size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-700">MCL Doctor</span>
              </div>
              <p className="text-xs text-gray-500">Select from the Master Customer List</p>
              {selectedDoctor && (
                <p className="text-xs font-medium text-blue-800 mt-1 truncate">
                  {selectedDoctor.full_name || `${selectedDoctor.first_name} ${selectedDoctor.last_name}`}
                </p>
              )}
            </button>
            <div className={`border-2 rounded-lg p-3 transition-colors ${
              selectedDoctor === null && (nonMclForm.name || nonMclForm.pan)
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck size={16} className="text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Non-MCL HCP</span>
              </div>
              <input
                className="input text-xs py-1 mb-1"
                placeholder="Full Name"
                value={nonMclForm.name}
                onChange={e => { setSelectedDoctor(null); setNonMclForm(f => ({ ...f, name: e.target.value })) }}
              />
              <input
                className="input text-xs py-1 mb-1"
                placeholder="PAN Number"
                value={nonMclForm.pan}
                onChange={e => { setSelectedDoctor(null); setNonMclForm(f => ({ ...f, pan: e.target.value })) }}
              />
              <input
                className="input text-xs py-1"
                placeholder="Email (optional)"
                value={nonMclForm.email}
                onChange={e => { setSelectedDoctor(null); setNonMclForm(f => ({ ...f, email: e.target.value })) }}
              />
            </div>
          </div>

          {/* FMV Calculator inline */}
          {selectedDoctor && (
            <FmvCalculator doctor={selectedDoctor} />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              className="btn-secondary"
              onClick={() => { setAddAgreementModal(false); setSelectedDoctor(null) }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={!selectedDoctor && !nonMclForm.name}
              onClick={handleAddAgreement}
            >
              Create Agreement
            </button>
          </div>
        </div>
      </Modal>

      {/* Doctor Search Modal */}
      <DoctorSearchModal
        open={doctorSearchOpen}
        onClose={() => setDoctorSearchOpen(false)}
        onSelect={(doc) => { setSelectedDoctor(doc); setDoctorSearchOpen(false) }}
      />

      {/* Standalone FMV Calculator Modal */}
      <Modal
        open={fmvDoctorModal}
        onClose={() => { setFmvDoctorModal(false); setFmvDoctor(null) }}
        title="FMV Calculator"
        size="lg"
      >
        <div className="space-y-3">
          <button
            className="btn-secondary text-sm"
            onClick={() => setDoctorSearchOpen(true)}
          >
            {fmvDoctor ? 'Change Doctor' : 'Select MCL Doctor'}
          </button>
          <FmvCalculator doctor={fmvDoctor} />
        </div>
      </Modal>
    </div>
  )
}
