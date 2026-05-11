import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { promotionalApi, accessApi } from '../../api/endpoints'
import PageHeader from '../../components/ui/PageHeader'

export default function PromotionalForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { register, handleSubmit } = useForm()
  const { data: divisions = [] } = useQuery({ queryKey: ['divisions'], queryFn: () => accessApi.listDivisions().then(r => r.data) })

  const create = useMutation({
    mutationFn: (data) => promotionalApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['promotional']); toast.success('Promotional event created'); navigate('/promotional') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error'),
  })

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader title="New Promotional Event" />
      <form onSubmit={handleSubmit(d => create.mutate(d))} className="card space-y-4">
        <div>
          <label className="label">Event Title *</label>
          <input className="input" {...register('event_title', { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Event Type</label>
            <select className="input" {...register('event_type')}>
              <option value="">Select</option>
              {['CME Sponsorship','Brand Reminder','Gift Item','Patient Education','Conference Sponsorship'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Month & Year</label>
            <input type="month" className="input" {...register('month_and_year')} />
          </div>
          <div>
            <label className="label">Division</label>
            <select className="input" {...register('division_id')}>
              <option value="">Select</option>
              {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Territory</label>
            <input className="input" {...register('territory')} />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" className="input" {...register('quantity')} />
          </div>
          <div>
            <label className="label">Rate Per Qty (INR)</label>
            <input type="number" step="0.01" className="input" {...register('rate_per_qty')} />
          </div>
          <div>
            <label className="label">Total Budget (INR)</label>
            <input type="number" step="0.01" className="input" {...register('total_budget')} />
          </div>
          <div>
            <label className="label">Target Audience</label>
            <input className="input" {...register('target_audience')} />
          </div>
        </div>
        <div>
          <label className="label">Objective</label>
          <textarea className="input h-20" {...register('objective')} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate('/promotional')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            {create.isPending ? 'Saving…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
