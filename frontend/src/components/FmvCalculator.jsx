import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { masterApi } from '../api/endpoints'
import { Calculator } from 'lucide-react'

const LABEL_MAP = {
  clinical_practice_experience: {
    label: 'Clinical Practice Experience',
    options: {
      '__5_Years_after_post_graduation': 'Less than 5 years post graduation',
      '_5_to_10_Years_post_graduation': '5–10 years post graduation',
      '_11_to_15_Years_post_graduation': '11–15 years post graduation',
      'More_than_15_Years_post_graduation': 'More than 15 years post graduation',
    }
  },
  investigator_experience: {
    label: 'Investigator Experience in Clinical Trials',
    options: {
      'No_experience': 'No experience',
      'Clinical_trial_experience': 'Clinical trial experience',
      'Primary_investigator_for_2_or_more_clinical_trials': 'Primary investigator (2+ trials)',
    }
  },
  expertise: {
    label: 'Level of Expertise',
    options: {
      'Speciality': 'Speciality',
      'Super_Speciality': 'Super Speciality',
    }
  },
  professional_position: {
    label: 'Professional Position',
    options: {
      'HCP_Consultant_with___15_years': 'HCP Consultant < 15 years',
      'Consultant_with___15_years': 'Consultant < 15 years',
      'Senior_Consultant_Director_HOD': 'Senior Consultant / Director / HOD',
      'Non_physician_HCP': 'Non-physician HCP',
    }
  },
  congress_experience: {
    label: 'Prior Experience at Congresses',
    options: {
      'State_level_conference': 'State level conference',
      'National_level_conference': 'National level conference',
      'International_level_conference': 'International level conference',
    }
  },
  publications: {
    label: 'Publications in Literature',
    options: {
      'No_Publications': 'No publications',
      'Less_than_10': 'Less than 10',
      '_10_to_25': '10 to 25',
      'More_than_25': 'More than 25',
    }
  },
}

function fmtCurrency(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
}

function humanize(val) {
  if (!val) return '—'
  return val.replace(/_/g, ' ').replace(/\$/g, '').trim()
}

export default function FmvCalculator({ doctor }) {
  const [criteria, setCriteria] = useState({
    clinical_practice_experience: '',
    investigator_experience: '',
    expertise: '',
    professional_position: '',
    congress_experience: '',
    publications: '',
  })
  const [hours, setHours] = useState(1)

  const { data: fmvList = [] } = useQuery({
    queryKey: ['fmv-criteria'],
    queryFn: () => masterApi.fmvCriteria().then(r => r.data),
  })

  const criteriaKeys = Object.keys(criteria)
  const allSelected = criteriaKeys.every(k => criteria[k])

  const matchedCriteria = useMemo(() => {
    if (!allSelected) return null
    return fmvList.find(fc =>
      criteriaKeys.every(k => {
        const fcVal = fc[k]
        const selVal = criteria[k]
        if (!fcVal) return true
        return fcVal === selVal || fcVal.includes(selVal) || selVal.includes(fcVal)
      })
    ) || null
  }, [fmvList, criteria, allSelected])

  const hourlyRate = parseFloat(doctor?.hourly_rate || 0)
  const maxCapping = parseFloat(doctor?.max_capping || 0)
  const proposedAmount = hourlyRate > 0 ? Math.min(hours * hourlyRate, maxCapping || Infinity) : 0

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-blue-50">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={18} className="text-blue-600" />
        <h4 className="font-semibold text-blue-900">FMV Calculator</h4>
        {doctor && (
          <span className="ml-auto text-xs text-gray-500">
            {doctor.full_name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()}
          </span>
        )}
      </div>

      {/* Doctor rates */}
      {doctor && (
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-xs text-gray-500 mb-0.5">Approved Hourly Rate</p>
            <p className="font-bold text-gray-800">{fmtCurrency(hourlyRate)}/hr</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-xs text-gray-500 mb-0.5">Maximum Capping</p>
            <p className="font-bold text-gray-800">{fmtCurrency(maxCapping)}</p>
          </div>
        </div>
      )}

      {/* 6 Criteria dropdowns */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {criteriaKeys.map(key => {
          const meta = LABEL_MAP[key]
          const uniqueVals = [...new Set(fmvList.map(fc => fc[key]).filter(Boolean))]
          return (
            <div key={key}>
              <label className="text-xs font-medium text-gray-700 block mb-1">{meta?.label || humanize(key)}</label>
              <select
                className="input text-sm py-1.5"
                value={criteria[key]}
                onChange={e => setCriteria(prev => ({ ...prev, [key]: e.target.value }))}
              >
                <option value="">Select…</option>
                {uniqueVals.map(v => (
                  <option key={v} value={v}>
                    {meta?.options?.[v] || humanize(v)}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {/* Hours input */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs font-medium text-gray-700 w-24">Hours of Service</label>
        <input
          type="number"
          min="0.5"
          max="8"
          step="0.5"
          className="input w-24 text-sm py-1.5"
          value={hours}
          onChange={e => setHours(parseFloat(e.target.value) || 1)}
        />
      </div>

      {/* Result */}
      {doctor && hourlyRate > 0 && (
        <div className="bg-white rounded-lg border-2 border-blue-200 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500">Hours</p>
              <p className="text-lg font-bold text-gray-800">{hours}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rate/hr</p>
              <p className="text-lg font-bold text-gray-800">{fmtCurrency(hourlyRate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Proposed Honorarium</p>
              <p className="text-xl font-bold text-blue-700">{fmtCurrency(proposedAmount)}</p>
            </div>
          </div>
          {maxCapping > 0 && hours * hourlyRate > maxCapping && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              Capped at maximum limit of {fmtCurrency(maxCapping)}
            </p>
          )}
          {allSelected && !matchedCriteria && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              No exact FMV criteria match found. Amount is based on doctor's approved rate.
            </p>
          )}
        </div>
      )}

      {!doctor && (
        <p className="text-xs text-gray-500 italic text-center">Select an MCL doctor to see FMV rates</p>
      )}
    </div>
  )
}
