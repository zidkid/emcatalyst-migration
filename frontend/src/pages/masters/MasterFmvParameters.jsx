import PageHeader from '../../components/ui/PageHeader'
import FmvParametersTab from './components/FmvParametersTab'

export default function MasterFmvParameters() {
  return (
    <div className="p-8">
      <PageHeader title="FMV Parameters" subtitle="Manage Fair Market Value parameters" />
      <FmvParametersTab />
    </div>
  )
}
