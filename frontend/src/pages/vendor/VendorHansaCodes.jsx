import { vendorApi } from '../../api/endpoints'
import SimpleVendorList from './SimpleVendorList'
import useAccessStore from '../../store/accessStore'

export default function VendorHansaCodes() {
  const { accessiblePages } = useAccessStore()
  const canAdd = accessiblePages.includes('vendor_hsn_sac_codes_add')
  const canEdit = accessiblePages.includes('vendor_hsn_sac_codes_edit')

  return (
    <SimpleVendorList
      title="HANSA Codes"
      subtitle="Manage HANSA codes"
      queryKey="vendor-hansa-codes"
      fetchFn={vendorApi.hansaCodes}
      createFn={vendorApi.createHansaCode}
      updateFn={vendorApi.updateHansaCode}
      deleteFn={vendorApi.deleteHansaCode}
      fieldName="code"
      fieldLabel="Code"
      canAdd={canAdd}
      canEdit={canEdit}
    />
  )
}
