import PageHeader from '../../components/ui/PageHeader'
import DivisionsTab from './components/DivisionsTab'

export default function MasterDivisions() {
  return (
    <div className="p-8">
      <PageHeader title="Divisions" subtitle="Manage division master data" />
      <DivisionsTab />
    </div>
  )
}
