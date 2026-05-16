import PageHeader from '../../components/ui/PageHeader'
import TherapeuticsTab from './components/TherapeuticsTab'

export default function MasterTherapeutics() {
  return (
    <div className="p-8">
      <PageHeader title="Therapeutics" subtitle="Manage therapeutical area master data" />
      <TherapeuticsTab />
    </div>
  )
}
