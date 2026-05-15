import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { eventsApi, masterApi } from '../../api/endpoints'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Upload, CheckCircle, AlertCircle, ArrowLeft, Trash2 } from 'lucide-react'

export default function PostEventDocuments() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [uploads, setUploads] = useState({}) // { docTypeId: File }

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id).then(r => r.data),
  })

  // Get required post-event document types for this event's type
  const { data: requiredDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['post-event-docs', event?.event_type],
    queryFn: () => masterApi.documentTypesForEvent(event?.event_type, 'post').then(r => r.data),
    enabled: !!event?.event_type,
  })

  const uploadDoc = useMutation({
    mutationFn: async ({ eventId, documentType, file }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', documentType)
      return eventsApi.uploadDocument(eventId, formData)
    },
    onSuccess: () => {
      qc.invalidateQueries(['event', id])
    },
  })

  const submitPostEvent = useMutation({
    mutationFn: () => eventsApi.submitPostEvent(id),
    onSuccess: () => {
      toast.success('Post-event documents submitted for approval')
      navigate('/events')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error submitting'),
  })

  const handleUploadAll = async () => {
    const entries = Object.entries(uploads)
    if (entries.length === 0) {
      toast.error('Please attach at least one document')
      return
    }

    // Check mandatory docs
    const mandatoryDocs = requiredDocs.filter(d => d.is_mandatory)
    const missingMandatory = mandatoryDocs.filter(d => !uploads[d.id])
    if (missingMandatory.length > 0) {
      toast.error(`Missing mandatory documents: ${missingMandatory.map(d => d.name).join(', ')}`)
      return
    }

    // Upload all files
    for (const [docTypeId, file] of entries) {
      const docType = requiredDocs.find(d => d.id === parseInt(docTypeId))
      await uploadDoc.mutateAsync({ eventId: id, documentType: docType?.name || 'Other', file })
    }

    // Submit for post-event approval
    submitPostEvent.mutate()
  }

  if (eventLoading || docsLoading) return <div className="p-8"><LoadingSpinner /></div>
  if (!event) return <div className="p-8 text-red-500">Event not found</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/events')} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <PageHeader
          title="Post-Event Document Submission"
          subtitle={`${event.event_code} • ${event.event_title}`}
        />
      </div>

      <div className="card mb-6 bg-[var(--color-primary-50)] border-[var(--color-primary-100)]">
        <p className="text-sm text-[var(--color-primary-hover)]">
          The event has been pre-approved and the event end date has passed. Please upload the required post-event documents and submit for post-event approval.
        </p>
      </div>

      <div className="space-y-4">
        {requiredDocs.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            No post-event document types configured for this event type. You can still submit.
          </div>
        ) : (
          requiredDocs.map(docType => (
            <div key={docType.id} className="card flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{docType.name}</p>
                  {docType.is_mandatory && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Required</span>
                  )}
                </div>
                {docType.code && <p className="text-xs text-gray-400">{docType.code}</p>}
              </div>
              <div className="flex items-center gap-3">
                {uploads[docType.id] ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle size={16} />
                    <span className="text-xs font-medium truncate max-w-[150px]">{uploads[docType.id].name}</span>
                  </div>
                ) : docType.is_mandatory ? (
                  <AlertCircle size={16} className="text-amber-500" />
                ) : null}
                {uploads[docType.id] && (
                  <button className="text-red-400 hover:text-red-600" onClick={() => setUploads(prev => { const n = {...prev}; delete n[docType.id]; return n })}>
                    <Trash2 size={14} />
                  </button>
                )}
                <label className="btn-secondary text-xs cursor-pointer flex items-center gap-1">
                  <Upload size={14} />
                  {uploads[docType.id] ? 'Change' : 'Upload'}
                  <input
                    type="file"
                    className="hidden"
                    onClick={e => { e.target.value = null }}
                    onChange={e => {
                      if (e.target.files[0]) {
                        setUploads(prev => ({ ...prev, [docType.id]: e.target.files[0] }))
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button className="btn-secondary" onClick={() => navigate('/events')}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleUploadAll}
          disabled={uploadDoc.isPending || submitPostEvent.isPending}
        >
          {uploadDoc.isPending || submitPostEvent.isPending ? 'Submitting…' : '✓ Submit Post-Event Documents'}
        </button>
      </div>
    </div>
  )
}
