import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { brsApi } from '../../api/endpoints'
import { fmtDate, fmtCurrency } from '../../utils/helpers'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { ArrowLeft, CheckCircle, XCircle, Clock, Download, ClipboardList, Edit2 } from 'lucide-react'
import useAuthStore from '../../store/authStore'

export default function BrsDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data: brs, isLoading } = useQuery({
    queryKey: ['brs', id],
    queryFn: () => brsApi.get(id).then(r => r.data),
  })

  const approve = useMutation({
    mutationFn: (remarks) => brsApi.approve(id, remarks),
    onSuccess: () => { qc.invalidateQueries(['brs', id]); toast.success('BRS Approved. Doctor credentials generated.') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error'),
  })

  const reject = useMutation({
    mutationFn: (reason) => brsApi.reject(id, reason),
    onSuccess: () => { qc.invalidateQueries(['brs', id]); setRejectModal(false); toast.success('BRS Rejected') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error'),
  })

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>
  if (!brs) return <div className="p-8 text-red-500">BRS not found</div>

  const isDivisionHead = user?.role === 'DivisionHead' || user?.roles?.includes('DivisionHead') || user?.role === 'Administrator'
  const canApprove = isDivisionHead && brs.status === 'Submitted'

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/brs')} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold">{brs.title || brs.survey_title}</h1>
            <p className="text-sm text-gray-500">{brs.brs_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {brs.status === 'Draft' && (
            <button className="btn-secondary flex items-center gap-1" onClick={() => navigate(`/brs/${id}/edit`)}><Edit2 size={14} /> Edit</button>
          )}
          {canApprove && <>
            <button className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1" onClick={() => approve.mutate('')}><CheckCircle size={15} /> Approve</button>
            <button className="btn-danger flex items-center gap-1" onClick={() => setRejectModal(true)}><XCircle size={15} /> Reject</button>
          </>}
          <StatusBadge status={brs.status} />
        </div>
      </div>

      {/* BRS Info */}
      <div className="card mb-4">
        <h3 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wide">Basic Details</h3>
        <div className="grid grid-cols-4 gap-4">
          <div><p className="text-xs text-gray-400">Created By</p><p className="text-sm font-medium">{brs.created_by?.name || '—'}</p></div>
          <div><p className="text-xs text-gray-400">Division</p><p className="text-sm font-medium">{brs.division_id || '—'}</p></div>
          <div><p className="text-xs text-gray-400">Cost Center</p><p className="text-sm font-medium">{brs.cost_center || '—'}</p></div>
          <div><p className="text-xs text-gray-400">Survey</p><p className="text-sm font-medium">{brs.survey_title}</p></div>
          <div><p className="text-xs text-gray-400">Title</p><p className="text-sm font-medium">{brs.title || '—'}</p></div>
          <div><p className="text-xs text-gray-400">Brand</p><p className="text-sm font-medium">{brs.brand || '—'}</p></div>
          <div><p className="text-xs text-gray-400">Therapeutic Area</p><p className="text-sm font-medium">{brs.therapeutic_area || '—'}</p></div>
          <div><p className="text-xs text-gray-400">Total Honorarium</p><p className="text-sm font-medium">{fmtCurrency(brs.total_honorarium_amount)}</p></div>
          {brs.topic && <div className="col-span-2"><p className="text-xs text-gray-400">Topic</p><p className="text-sm">{brs.topic}</p></div>}
        </div>
      </div>

      {/* Event Info */}
      <div className="card mb-4">
        <h3 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wide">Event Information</h3>
        <div className="grid grid-cols-4 gap-4">
          <div><p className="text-xs text-gray-400">On Field Execution By</p><p className="text-sm font-medium">{brs.on_field_execution_by || '—'}</p></div>
          <div><p className="text-xs text-gray-400">Start Date</p><p className="text-sm font-medium">{fmtDate(brs.start_date)}</p></div>
          <div><p className="text-xs text-gray-400">End Date</p><p className="text-sm font-medium">{fmtDate(brs.end_date)}</p></div>
          <div><p className="text-xs text-gray-400">Created At</p><p className="text-sm font-medium">{fmtDate(brs.created_at)}</p></div>
          {brs.approved_by && <div><p className="text-xs text-gray-400">Approved By</p><p className="text-sm font-medium">{brs.approved_by.name}</p></div>}
          {brs.approved_at && <div><p className="text-xs text-gray-400">Approved At</p><p className="text-sm font-medium">{fmtDate(brs.approved_at)}</p></div>}
        </div>
        {brs.rationale && <div className="mt-3"><p className="text-xs text-gray-400">Rationale</p><p className="text-sm bg-gray-50 p-2 rounded">{brs.rationale}</p></div>}
        {brs.agenda && <div className="mt-3"><p className="text-xs text-gray-400">Agenda</p><p className="text-sm bg-gray-50 p-2 rounded">{brs.agenda}</p></div>}
        {brs.remarks && <div className="mt-3"><p className="text-xs text-gray-400">Remarks</p><p className="text-sm bg-gray-50 p-2 rounded">{brs.remarks}</p></div>}
      </div>

      {/* Rejection reason */}
      {brs.rejection_reason && (
        <div className="card mb-4 bg-red-50 border-red-200">
          <p className="text-xs text-red-400 mb-1">Rejection Reason</p>
          <p className="text-sm text-red-700">{brs.rejection_reason}</p>
        </div>
      )}

      {/* Doctors */}
      <div className="card mb-4">
        <h3 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wide">Doctors ({brs.doctors?.length || 0})</h3>
        {brs.doctors?.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <table className="text-sm w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Name', 'Name As Per PAN', 'PAN', 'Email', 'Speciality', 'Honorarium', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {brs.doctors.map(d => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-medium">{d.doctor_name}</td>
                    <td className="px-3 py-2">{d.name_as_per_pan || '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{d.pan_number || '—'}</td>
                    <td className="px-3 py-2 text-xs">{d.email || '—'}</td>
                    <td className="px-3 py-2 text-xs">{d.speciality || '—'}</td>
                    <td className="px-3 py-2">{d.honorarium_amount ? fmtCurrency(d.honorarium_amount) : '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status={d.doctor_status} /></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        {d.has_signature && (
                          <button
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            onClick={async () => {
                            try {
                              const res = await brsApi.getDoctorAgreement(d.id)
                              const data = res.data
                              const today = new Date().toLocaleDateString('en-IN')
                              const w = window.open('', '_blank')
                              w.document.write(`
<html><head><title>Agreement - ${data.doctor_name}</title>
<style>
body{font-family:Arial,sans-serif;padding:50px 60px;max-width:800px;margin:auto;font-size:13px;line-height:1.7;color:#333}
h2{text-align:center;font-size:16px;margin-bottom:4px}
.subtitle{text-align:center;font-size:12px;color:#666;margin-bottom:30px}
.to-block{margin-bottom:20px}
.usage-block{margin-bottom:20px}
.usage-block p{margin:2px 0}
ol{padding-left:20px}
ol li{margin-bottom:12px}
.sig-section{margin-top:40px;display:flex;justify-content:space-between;border-top:1px solid #ccc;padding-top:30px}
.sig-box{width:45%}
.sig-box p{margin:4px 0}
.sig-box img{max-height:80px;margin-top:8px}
@media print{.no-print{display:none}body{padding:30px 40px}}
</style></head><body>
<h2>EXPERT SERVICES AGREEMENT (Survey)</h2>
<p class="subtitle">BRS ID: ${brs.brs_code} / Date: ${data.agreement_signed_at ? new Date(data.agreement_signed_at).toLocaleDateString('en-IN') : today}</p>

<div class="to-block">
<p>To,</p>
<p><strong>Dr. ${data.name_as_per_pan || data.doctor_name}</strong>,</p>
</div>

<div class="usage-block">
<p><strong>Usage of:</strong> ${brs.survey_title || brs.title || ''}</p>
<p><strong>Field of:</strong> ${brs.title || brs.survey_title || ''}</p>
<p><strong>Amount:</strong> INR ${Number(data.honorarium_amount).toLocaleString('en-IN')}/-</p>
</div>

<ol>
<li>We wish to seek your expert advice on usage of the above mentioned subject and its combination in different age group of patients and in furtherance to our discussion in this regard, we are pleased to appoint you as an Expert representing Emcure Pharmaceuticals Limited (hereinafter referred to as 'Emcure / Company').</li>
<li>You are requested to perform the following activities as an 'Expert' (hereinafter referred to as 'purpose'):<br/><em>i. Advise and update the Company on developments and issues in the field mentioned above, in form of written opinions or expert survey reports.</em></li>
<li>Emcure reserves the right to publish any lecture/talk given by you in such scientific congresses/conferences/meetings/seminars in any medical journals, make CDs and/or DVDs. The 'period' for your services shall begin on the date you sign this Agreement and shall continue for a period of one (1) year or such earlier period as the Company may deem appropriate. Emcure retains the right to terminate this Agreement without cause, by giving a ten (10) days written intimation to you.</li>
<li>In exchange for you acting as our Expert in accordance with this Agreement, Emcure will pay you by cheque or e-transfer (in your name only) into your nominated account a onetime service fee <strong>INR ${Number(data.honorarium_amount).toLocaleString('en-IN')}/- (Rupees ${data.honorarium_amount ? 'as agreed' : ''})</strong> ('fees') for rendering expert services to the Company. Emcure will make such payment subject to necessary statutory deductions of withholding tax at the prevailing rates as per The Income Tax Act, 1961 and necessary certificate for the same will be provided to you.</li>
<li>You agree not to use or disclose to third parties any confidential information which you will have access to during the course of providing service for so long as it remains unpublished.</li>
<li>The following shall be an integral part of the deliverable to be provided by you to the Company:<br/><em>i. Your opinion/surveys on the topics for which your expert advice has been sought for under this Agreement on your letter head.</em></li>
<li>Emcure confirms that your responsibilities as Emcure's Expert are in no way linked to or dependent on your prescribing or promoting Emcure's products. Payments and reimbursements under this Agreement strictly carry no obligation to promote any product.</li>
<li>You agree to fulfill all the obligations under this Agreement in accordance with any professional standards, applicable laws and regulations.</li>
<li>By signing below, you agree not to use or disclose to third parties any confidential information which you will have access to during the course of providing service.</li>
<li>During the period of this Agreement, any documentation and data disclosed by the Company to you or created within the scope of this agreement shall be the sole and exclusive property of Emcure.</li>
<li>You confirm that you have no conflict of interest which would prevent you from acting as an Expert in accordance with this Agreement.</li>
<li>Emcure encourages you to be transparent about your involvement as Expert.</li>
<li>Neither party may assign its rights or otherwise transfer this Agreement without the prior written consent of the other party.</li>
<li>The parties are independent contractors and nothing in this Agreement implies any partnership, agency or employment relationship between the parties.</li>
<li>This Agreement constitutes the entire agreement of the parties and supersedes any verbal or other agreements between the parties with respect to its subject matter.</li>
<li>This Agreement is governed by and constructed in accordance with laws of India. Any dispute arising out of this Agreement shall be decided by arbitration under the Arbitration and Conciliation Act, 1996 at Pune.</li>
</ol>

<div class="sig-section">
<div class="sig-box">
<p><strong>HCP Name:</strong></p>
<p>${data.name_as_per_pan || data.doctor_name}</p>
<p style="margin-top:16px"><strong>HCP Signature:</strong></p>
<img src="${data.signature}" alt="Doctor Signature" />
</div>
<div class="sig-box">
<p><strong>Emcure Authorized Signatory</strong></p>
<p>Name: _______________</p>
<p style="margin-top:16px">Sign: _______________</p>
</div>
</div>

<div class="no-print" style="margin-top:30px;text-align:center">
<button onclick="window.print()" style="padding:10px 30px;background:#003087;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px">Download as PDF / Print</button>
</div>
</body></html>`)
                              w.document.close()
                            } catch (e) {
                              toast.error('Agreement not available')
                            }
                          }}
                        >
                          <Download size={12} /> Agreement
                        </button>
                        )}
                        {d.survey_responses && (
                          <button
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                            onClick={() => {
                              const w = window.open('', '_blank')
                              const responses = d.survey_responses
                              w.document.write(`
<html><head><title>Survey Responses - ${d.doctor_name}</title>
<style>
body{font-family:Arial,sans-serif;padding:50px 60px;max-width:800px;margin:auto;font-size:13px;color:#333}
h2{text-align:center;margin-bottom:4px}
.subtitle{text-align:center;color:#666;font-size:12px;margin-bottom:30px}
.info{margin-bottom:20px;padding:15px;background:#f5f8ff;border-radius:6px}
.info p{margin:4px 0}
.qa{margin-bottom:16px;padding:12px;border:1px solid #e5e7eb;border-radius:6px}
.qa .q{font-weight:bold;margin-bottom:6px;color:#374151}
.qa .a{color:#1f2937;padding-left:12px}
@media print{.no-print{display:none}}
</style></head><body>
<h2>Survey Responses</h2>
<p class="subtitle">BRS: ${brs.brs_code}</p>
<div class="info">
<p><strong>Doctor:</strong> ${d.doctor_name}</p>
<p><strong>PAN:</strong> ${d.pan_number || '—'}</p>
<p><strong>Email:</strong> ${d.email || '—'}</p>
<p><strong>Completed:</strong> ${d.survey_completed_at ? new Date(d.survey_completed_at).toLocaleDateString('en-IN') : '—'}</p>
</div>
${Object.entries(responses).map(([qId, val]) => {
  const question = typeof val === 'object' && val?.question ? val.question : `Question ${qId}`
  const answer = typeof val === 'object' && val?.answer != null ? (Array.isArray(val.answer) ? val.answer.join(', ') : val.answer) : (typeof val === 'string' ? val : (Array.isArray(val) ? val.join(', ') : String(val || '—')))
  return `<div class="qa"><div class="q">${question}</div><div class="a">${answer || '—'}</div></div>`
}).join('')}
<div class="no-print" style="margin-top:30px;text-align:center">
<button onclick="window.print()" style="padding:10px 30px;background:#003087;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px">Download as PDF / Print</button>
</div>
</body></html>`)
                              w.document.close()
                            }}
                          >
                            <ClipboardList size={12} /> Responses
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-gray-400">No doctors added.</p>}
      </div>

      {/* Audit Trail */}
      <div className="card">
        <h3 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wide">Audit Trail</h3>
        {brs.audit_trail?.length > 0 ? (
          <div className="space-y-2">
            {brs.audit_trail.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div>
                  <span className="font-medium">{entry.action}</span>
                  {entry.to_status && <> → <StatusBadge status={entry.to_status} /></>}
                  <p className="text-xs text-gray-500">by {entry.performed_by} • {fmtDate(entry.created_at)}</p>
                  {entry.remarks && <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mt-1">{entry.remarks}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">No audit trail.</p>}
      </div>

      {/* Reject Modal */}
      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Reject BRS">
        <div className="space-y-4">
          <textarea className="input h-24" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection…" />
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setRejectModal(false)}>Cancel</button>
            <button className="btn-danger" onClick={() => reject.mutate(rejectReason)} disabled={!rejectReason}>Reject</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
