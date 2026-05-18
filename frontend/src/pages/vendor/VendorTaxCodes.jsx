import { vendorApi } from '../../api/endpoints'
import SimpleVendorList from './SimpleVendorList'
import useAccessStore from '../../store/accessStore'

export default function VendorTaxCodes() {
  const { accessiblePages } = useAccessStore()
  const canAdd = accessiblePages.includes('vendor_tax_codes_add')
  const canEdit = accessiblePages.includes('vendor_tax_codes_edit')

  return (
    <SimpleVendorList
      title="Tax Codes"
      subtitle="Manage vendor tax codes"
      queryKey="vendor-tax-codes"
      fetchFn={vendorApi.taxCodes}
      createFn={vendorApi.createTaxCode}
      updateFn={vendorApi.updateTaxCode}
      deleteFn={vendorApi.deleteTaxCode}
      fieldName="code"
      fieldLabel="Code"
      canAdd={canAdd}
      canEdit={canEdit}
    />
  )
}
