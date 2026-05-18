import { vendorApi } from '../../api/endpoints'
import SimpleVendorList from './SimpleVendorList'
import useAccessStore from '../../store/accessStore'

export default function VendorBusinessAreas() {
  const { accessiblePages } = useAccessStore()
  const canAdd = accessiblePages.includes('vendor_business_areas_add')
  const canEdit = accessiblePages.includes('vendor_business_areas_edit')

  return (
    <SimpleVendorList
      title="Business Areas"
      subtitle="Manage vendor business areas"
      queryKey="vendor-business-areas"
      fetchFn={vendorApi.businessAreas}
      createFn={vendorApi.createBusinessArea}
      updateFn={vendorApi.updateBusinessArea}
      deleteFn={vendorApi.deleteBusinessArea}
      canAdd={canAdd}
      canEdit={canEdit}
    />
  )
}
