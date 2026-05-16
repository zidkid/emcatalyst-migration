import PageHeader from '../../components/ui/PageHeader'
import DoctorsTab from './components/DoctorsTab'

export default function MasterDoctors() {
  return (
    <div className="p-8">
      <PageHeader title="Doctors" subtitle="Manage doctor master data" />
      <DoctorsTab />
    </div>
  )
}
