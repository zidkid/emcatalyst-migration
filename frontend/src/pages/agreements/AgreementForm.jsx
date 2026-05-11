import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { agreementsApi } from '../../api/endpoints'
import PageHeader from '../../components/ui/PageHeader'

export default function AgreementForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { register, handleSubmit } = useForm({ defaultValues: { currency: 'INR' } })

  const create = useMutation({
    mutationFn: (data) => agreementsApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['agreements']); toast.success('Agreement created'); navigate('/agreements') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error'),
  })

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader title="New Agreement" />
      <form onSubmit={handleSubmit(d => create.mutate(d))} className="card space-y-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" {...register('title', { required: true })} placeholder="Agreement title" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Agreement Type</label>
            <select className="input" {...register('agreement_type')}>
              <option value="">Select type</option>
              {['Service Agreement','Vendor Agreement','NDA','MOU','Rate Contract','Consultancy'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Party Name</label>
            <input className="input" {...register('party_name')} />
          </div>
          <div>
            <label className="label">Party Email</label>
            <input type="email" className="input" {...register('party_email')} />
          </div>
          <div>
            <label className="label">Party Contact</label>
            <input className="input" {...register('party_contact')} />
          </div>
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input" {...register('start_date')} />
          </div>
          <div>
            <label className="label">End Date</label>
            <input type="date" className="input" {...register('end_date')} />
          </div>
          <div>
            <label className="label">Agreement Value</label>
            <input type="number" step="0.01" className="input" {...register('value')} />
          </div>
          <div>
            <label className="label">Payment Terms</label>
            <input className="input" {...register('payment_terms')} placeholder="e.g. Net 30 days" />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input h-24" {...register('description')} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate('/agreements')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            {create.isPending ? 'Saving…' : 'Create Agreement'}
          </button>
        </div>
      </form>
    </div>
  )
}
