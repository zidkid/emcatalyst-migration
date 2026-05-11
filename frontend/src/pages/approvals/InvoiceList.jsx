import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText } from 'lucide-react'
import { invoicesApi } from '../../api/endpoints'
import { fmtDate, fmtCurrency } from '../../utils/helpers'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

export default function InvoiceList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => invoicesApi.list({ status: statusFilter || undefined, limit: 100 }).then(r => r.data),
  })

  const filtered = invoices.filter(inv =>
    !search ||
    inv.serial_no?.toLowerCase().includes(search.toLowerCase()) ||
    inv.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.vendor_code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <PageHeader
        title="Vendor Invoices & Approvals"
        subtitle="Manage invoice submissions, GST verification, and payment approvals"
        actions={
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/approvals/new')}>
            <Plus size={16} /> New Invoice
          </button>
        }
      />
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="input pl-9" placeholder="Search by serial no, vendor…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['Pending','Compliance Approved','Finance Approved','GST Verified','OPEX Approved','Payment Initiated','Paid','Rejected'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices found" description="Submit your first vendor invoice" action={<button className="btn-primary" onClick={() => navigate('/approvals/new')}>New Invoice</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Serial No','Vendor','Document Date','Amount','GST','TDS','Net','Status',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/approvals/${inv.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{inv.serial_no}</td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{inv.vendor_name || inv.vendor_code}</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(inv.document_date)}</td>
                  <td className="px-4 py-3">{fmtCurrency(inv.vendor_amount)}</td>
                  <td className="px-4 py-3 text-xs">{fmtCurrency((inv.igst_amount || 0) + (inv.cgst_amount || 0) + (inv.sgst_amount || 0))}</td>
                  <td className="px-4 py-3 text-xs">{fmtCurrency(inv.tds_amount)}</td>
                  <td className="px-4 py-3 font-semibold">{fmtCurrency(inv.net_amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3"><button className="text-blue-600 text-xs hover:underline">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
