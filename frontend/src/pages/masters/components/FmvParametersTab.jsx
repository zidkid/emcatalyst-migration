import { useQuery } from '@tanstack/react-query'
import { masterApi } from '../../../api/endpoints'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function FmvParametersTab() {
  const { data: params = {}, isLoading } = useQuery({
    queryKey: ['fmv-parameters'],
    queryFn: () => masterApi.fmvParameters().then(r => r.data),
  })

  const paramNames = Object.keys(params)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{paramNames.length} parameter categories</p>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {paramNames.map(name => (
            <div key={name} className="card">
              <h4 className="font-semibold text-sm mb-3">{name}</h4>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Code</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Option</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {params[name].map(opt => (
                    <tr key={opt.id}>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--color-primary)]">{opt.option_code}</td>
                      <td className="px-3 py-2">{opt.option_label}</td>
                      <td className="px-3 py-2 font-bold">{opt.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* FMV Category Reference */}
          <div className="card bg-[var(--color-primary-50)]">
            <h4 className="font-semibold text-sm mb-2">FMV Category Calculation</h4>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-1 font-medium">Cat A: 19–24 points</td><td>₹15,000/hr (capping ₹75,000)</td></tr>
                <tr><td className="py-1 font-medium">Cat B: 10–18 points</td><td>₹10,000/hr (capping ₹50,000)</td></tr>
                <tr><td className="py-1 font-medium">Cat C: &lt;10 points</td><td>₹5,000/hr (capping ₹30,000)</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">Note: Hourly rates not applicable for Super Speciality</p>
          </div>
        </div>
      )}
    </div>
  )
}
