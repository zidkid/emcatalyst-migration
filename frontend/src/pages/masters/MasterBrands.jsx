import PageHeader from '../../components/ui/PageHeader'
import BrandsTab from './components/BrandsTab'

export default function MasterBrands() {
  return (
    <div className="p-8">
      <PageHeader title="Brands" subtitle="Manage brand master data" />
      <BrandsTab />
    </div>
  )
}
