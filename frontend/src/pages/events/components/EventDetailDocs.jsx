import { fmtDate } from '../../../utils/helpers'

export default function EventDetailDocs({ event }) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Uploaded Documents</h3>
      {event.documents?.length > 0 ? (
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['Type', 'File Name', 'Uploaded At'].map(h => <th key={h} className="px-3 py-2 text-left text-xs text-gray-500">{h}</th>)}</tr></thead>
          <tbody className="divide-y">
            {event.documents.map(d => (
              <tr key={d.id}>
                <td className="px-3 py-2 font-medium">{d.document_type}</td>
                <td className="px-3 py-2 text-[var(--color-primary)]">{d.document_name}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{fmtDate(d.uploaded_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="text-sm text-gray-400">No documents uploaded yet.</p>}
    </div>
  )
}
