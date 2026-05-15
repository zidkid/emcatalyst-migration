import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { masterApi } from '../api/endpoints'
import api from '../api/client'
import Modal from './ui/Modal'
import { Search, CheckCircle } from 'lucide-react'

function fmtCurrency(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
}

export default function DoctorSearchModal({ open, onClose, onSelect, surveyId }) {
  const [searchQ, setSearchQ] = useState('')

  // If surveyId is provided, fetch only mapped doctors; otherwise search all MCL
  const { data: doctors = [], isFetching } = useQuery({
    queryKey: surveyId ? ['survey-doctors', surveyId, searchQ] : ['hcp-doctors-search', searchQ],
    queryFn: async () => {
      if (surveyId) {
        const res = await api.get(`/brs/surveys/${surveyId}/doctors`)
        const all = res.data || []
        if (!searchQ) return all
        const q = searchQ.toLowerCase()
        return all.filter(d =>
          (d.full_name || '').toLowerCase().includes(q) ||
          (d.uid_number || '').toLowerCase().includes(q) ||
          (d.email || '').toLowerCase().includes(q) ||
          (d.city || '').toLowerCase().includes(q) ||
          (d.pan_number || '').toLowerCase().includes(q)
        )
      }
      return masterApi.hcpDoctors(searchQ || null, 100).then(r => r.data)
    },
    enabled: open,
  })

  return (
    <Modal open={open} onClose={onClose} title="Search MCL / HCP Doctor" size="lg">
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            className="input pl-9"
            placeholder="Search by name, PAN, city, email…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>

        <p className="text-xs text-gray-400">
          {isFetching ? 'Searching…' : `${doctors.length} doctor(s) found`}
        </p>

        <div className="overflow-y-auto max-h-80 divide-y border rounded-lg">
          {doctors.length === 0 && !isFetching && (
            <div className="p-4 text-center text-sm text-gray-400">
              {searchQ ? 'No doctors found' : 'Start typing to search'}
            </div>
          )}
          {doctors.map(doc => {
            const docId = doc.id || doc.hcp_doctor_id
            return (
            <button
              key={docId}
              className="w-full text-left px-4 py-3 hover:bg-[var(--color-primary-50)] transition-colors flex items-start gap-3"
              onClick={() => { onSelect({ ...doc, id: docId }); onClose() }}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {(doc.full_name || doc.first_name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {doc.full_name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim()}
                  {doc.qualification && <span className="text-gray-500 font-normal"> ({doc.qualification})</span>}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {doc.uid_number && <span className="font-mono text-[var(--color-primary)]">{doc.uid_number}</span>}
                  {doc.uid_number && ' • '}
                  {[doc.city, doc.state].filter(Boolean).join(', ')}
                </p>
                <p className="text-xs text-[var(--color-primary)]">
                  Rate: {fmtCurrency(doc.hourly_rate)}/hr
                  {doc.max_capping && ` • Cap: ${fmtCurrency(doc.max_capping)}`}
                </p>
              </div>
              <CheckCircle size={16} className="shrink-0 text-emerald-500 mt-1" />
            </button>
          )})}
        </div>
      </div>
    </Modal>
  )
}
