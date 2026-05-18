import { vendorApi } from '../../api/endpoints'
import SimpleVendorList from './SimpleVendorList'
import useAccessStore from '../../store/accessStore'

export default function VendorSponsorshipTypes() {
  const { accessiblePages } = useAccessStore()
  const canAdd = accessiblePages.includes('vendor_vendors_add')
  const canEdit = accessiblePages.includes('vendor_vendors_edit')

  return (
    <SimpleVendorList
      title="Sponsorship Request Types"
      subtitle="Manage types of sponsorship requests"
      queryKey="vendor-sponsorship-types"
      fetchFn={vendorApi.sponsorshipRequestTypes}
      createFn={vendorApi.createSponsorshipRequestType}
      updateFn={vendorApi.updateSponsorshipRequestType}
      deleteFn={vendorApi.deleteSponsorshipRequestType}
      canAdd={canAdd}
      canEdit={canEdit}
    />
  )
}
