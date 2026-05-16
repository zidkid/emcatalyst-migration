import PageHeader from '../../components/ui/PageHeader'
import DocumentTypesTab from './components/DocumentTypesTab'

export default function MasterDocumentTypes() {
  return (
    <div className="p-8">
      <PageHeader title="Document Types" subtitle="Manage document type master data" />
      <DocumentTypesTab />
    </div>
  )
}
