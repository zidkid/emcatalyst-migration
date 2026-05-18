import { vendorApi } from '../../api/endpoints'
import SimpleVendorList from './SimpleVendorList'
import useAccessStore from '../../store/accessStore'

export default function VendorBusinessPlaces() {
  const { accessiblePages } = useAccessStore()
  const canAdd = accessiblePages.includes('vendor_business_places_add')
  const canEdit = accessiblePages.includes('vendor_business_places_edit')

  return (
    <SimpleVendorList
      title="Business Places"
      subtitle="Manage vendor business places"
      queryKey="vendor-business-places"
      fetchFn={vendorApi.businessPlaces}
      createFn={vendorApi.createBusinessPlace}
      updateFn={vendorApi.updateBusinessPlace}
      deleteFn={vendorApi.deleteBusinessPlace}
      canAdd={canAdd}
      canEdit={canEdit}
    />
  )
}
