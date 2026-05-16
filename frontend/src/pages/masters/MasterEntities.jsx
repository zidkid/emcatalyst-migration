import PageHeader from '../../components/ui/PageHeader'
import EntitiesTab from './components/EntitiesTab'

export default function MasterEntities() {
  return (
    <div className="p-8">
      <PageHeader title="Entities" subtitle="Manage entity master data" />
      <EntitiesTab />
    </div>
  )
}
