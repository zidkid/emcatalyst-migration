import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { invoicesApi } from '../../api/endpoints'
import PageHeader from '../../components/ui/PageHeader'

export default function InvoiceForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { currency: 'INR', igst_flag: false }
  })

  const vendorAmount = parseFloat(watch('vendor_amount') || 0)
  const igstFlag = watch('igst_flag')
  const gstRate = parseFloat(watch('gst_rate') || 0)
  const tdsRate = parseFloat(watch('tds_rate') || 0)
  const gstAmount = vendorAmount * gstRate / 100
  const tdsAmount = vendorAmount * tdsRate / 100
  const netAmount = vendorAmount + gstAmount - tdsAmount

  const create = useMutation({
    mutationFn: (data) => invoicesApi.create({
      ...data,
      igst_amount: igstFlag ? gstAmount : undefined,
      cgst_amount: !igstFlag ? gstAmount / 2 : undefined,
      sgst_amount: !igstFlag ? gstAmount / 2 : undefined,
      tds_amount: tdsAmount,
      net_amount: netAmount,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['invoices'])
      toast.success('Invoice created successfully')
      navigate('/approvals')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error'),
  })

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="New Vendor Invoice" subtitle="Create a new invoice for approval workflow" />
      <form onSubmit={handleSubmit(d => create.mutate(d))} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vendor Code (LIFNR)</label>
            <input className="input" {...register('vendor_code')} placeholder="e.g. 10001234" />
          </div>
          <div>
            <label className="label">Vendor Name</label>
            <input className="input" {...register('vendor_name')} placeholder="Vendor / Supplier name" />
          </div>
          <div>
            <label className="label">Document Date</label>
            <input type="date" className="input" {...register('document_date')} />
          </div>
          <div>
            <label className="label">Posting Date</label>
            <input type="date" className="input" {...register('posting_date')} />
          </div>
          <div>
            <label className="label">Reference No.</label>
            <input className="input" {...register('reference')} />
          </div>
          <div>
            <label className="label">Document Type</label>
            <select className="input" {...register('document_type')}>
              <option value="KR">KR - Vendor Invoice</option>
              <option value="RE">RE - Goods Receipt Invoice</option>
              <option value="KG">KG - Vendor Credit Memo</option>
            </select>
          </div>
          <div>
            <label className="label">Invoice Amount (Before Tax)</label>
            <input type="number" step="0.01" className="input" {...register('vendor_amount')} />
          </div>
          <div>
            <label className="label">Company Code</label>
            <input className="input" {...register('comp_code')} defaultValue="EMC1" />
          </div>
          <div>
            <label className="label">Cost Center</label>
            <input className="input" {...register('cost_center')} />
          </div>
          <div>
            <label className="label">GL Account</label>
            <input className="input" {...register('gl_account')} />
          </div>
          <div>
            <label className="label">GST Rate (%)</label>
            <select className="input" {...register('gst_rate')}>
              <option value="0">0% (Exempt)</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>
          <div>
            <label className="label">TDS Rate (%)</label>
            <select className="input" {...register('tds_rate')}>
              <option value="0">0% (No TDS)</option>
              <option value="1">1%</option>
              <option value="2">2%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
            </select>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <input type="checkbox" id="igst" {...register('igst_flag')} className="w-4 h-4" />
            <label htmlFor="igst" className="text-sm font-medium text-gray-700">Apply IGST (interstate transaction)</label>
          </div>
        </div>

        {/* Tax Summary */}
        <div className="bg-[var(--color-primary-50)] rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">Tax Calculation Preview</p>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div><p className="text-gray-500">Base Amount</p><p className="font-bold">₹{vendorAmount.toFixed(2)}</p></div>
            <div><p className="text-gray-500">{igstFlag ? 'IGST' : 'CGST+SGST'}</p><p className="font-bold">₹{gstAmount.toFixed(2)}</p></div>
            <div><p className="text-gray-500">TDS</p><p className="font-bold text-red-600">-₹{tdsAmount.toFixed(2)}</p></div>
            <div><p className="text-gray-500">Net Payable</p><p className="font-bold text-emerald-700">₹{netAmount.toFixed(2)}</p></div>
          </div>
        </div>

        <div>
          <label className="label">Narration / Remarks</label>
          <textarea className="input h-20" {...register('text')} placeholder="Invoice description…" />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate('/approvals')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            {create.isPending ? 'Saving…' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}
