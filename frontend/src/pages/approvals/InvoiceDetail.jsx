import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { invoicesApi } from '../../api/endpoints'
import { fmtDate, fmtCurrency, fmtDateTime } from '../../utils/helpers'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { ArrowLeft } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const ROLE_NEXT_STATUS = {
  ComplianceUser: 'Compliance Approved',
  FinanceUser: 'Finance Approved',
  GSTuser: 'GST Verified',
  OPEXUser: 'OPEX Approved',
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [approvalModal, setApprovalModal] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [action, setAction] = useState('Approved')

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id).then(r => r.data),
  })

  const approve = useMutation({
    mutationFn: () => invoicesApi.approve(id, { action, remarks, approver_role: user?.role }),
    onSuccess: () => { qc.invalidateQueries(['invoice', id]); setApprovalModal(false); toast.success(`Invoice ${action}`) },
  })
  const postToSap = useMutation({
    mutationFn: () => invoicesApi.postToSap(id),
    onSuccess: () => { qc.invalidateQueries(['invoice', id]); toast.success('Posted to SAP') },
  })

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>
  if (!invoice) return <div className="p-8 text-red-500">Invoice not found</div>

  const canApprove = ROLE_NEXT_STATUS[user?.role]
  const canPost = user?.role === 'FinanceUser' && invoice.status === 'OPEX Approved'

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/approvals')} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={20} /></button>
        <PageHeader
          title={`Invoice: ${invoice.serial_no}`}
          subtitle={`${invoice.vendor_name || invoice.vendor_code} • ${fmtDate(invoice.document_date)}`}
          actions={
            <div className="flex gap-2">
              {canApprove && <button className="btn-primary" onClick={() => setApprovalModal(true)}>Take Action</button>}
              {canPost && <button className="btn-primary bg-purple-600 hover:bg-purple-700" onClick={() => postToSap.mutate()}>Post to SAP</button>}
              <StatusBadge status={invoice.status} />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          ['Amount', fmtCurrency(invoice.vendor_amount)],
          ['IGST', fmtCurrency(invoice.igst_amount)],
          ['CGST+SGST', fmtCurrency((invoice.cgst_amount||0)+(invoice.sgst_amount||0))],
          ['TDS', fmtCurrency(invoice.tds_amount)],
          ['Net Payable', fmtCurrency(invoice.net_amount)],
          ['SAP Doc No', invoice.sap_doc_no || '—'],
          ['UTR No', invoice.utr_no || '—'],
          ['Company Code', invoice.comp_code || '—'],
        ].map(([label, value]) => (
          <div key={label} className="card py-3 px-4">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-semibold text-sm mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Approval Trail */}
      {invoice.approvals?.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-3">Approval Trail</h3>
          <div className="space-y-2">
            {invoice.approvals.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b last:border-0">
                <span className={`badge-${a.action === 'Approved' ? 'approved' : 'rejected'}`}>{a.action}</span>
                <span className="text-gray-500">{a.approver_role}</span>
                <span className="text-gray-400">{fmtDateTime(a.action_date)}</span>
                {a.remarks && <span className="text-gray-600 italic">"{a.remarks}"</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={approvalModal} onClose={() => setApprovalModal(false)} title="Invoice Action">
        <div className="space-y-4">
          <div>
            <label className="label">Action</label>
            <select className="input" value={action} onChange={e => setAction(e.target.value)}>
              <option value="Approved">Approve</option>
              <option value="Rejected">Reject</option>
              <option value="OnHold">Put on Hold</option>
            </select>
          </div>
          <div>
            <label className="label">Remarks</label>
            <textarea className="input h-20" value={remarks} onChange={e => setRemarks(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setApprovalModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => approve.mutate()} disabled={approve.isPending}>Confirm</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
