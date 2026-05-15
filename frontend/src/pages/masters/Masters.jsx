import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '../../api/endpoints'
import PageHeader from '../../components/ui/PageHeader'
import FmvParametersTab from './components/FmvParametersTab'
import DoctorsTab from './components/DoctorsTab'
import BrandsTab from './components/BrandsTab'
import DocumentTypesTab from './components/DocumentTypesTab'
import TherapeuticsTab from './components/TherapeuticsTab'
import MealsTab from './components/MealsTab'
import DivisionsTab from './components/DivisionsTab'
import EntitiesTab from './components/EntitiesTab'

const TABS = ['FMV Parameters', 'Doctors (MCL)', 'Therapeutics', 'Brands', 'Meals', 'Document Types', 'Divisions', 'Entities']

export default function Masters() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="p-8">
      <PageHeader title="Master Data" subtitle="Reference data used across the application" />

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-6 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === i ? 'border-emcure-blue text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && <FmvParametersTab />}
      {activeTab === 1 && <DoctorsTab />}
      {activeTab === 2 && <TherapeuticsTab />}
      {activeTab === 3 && <BrandsTab />}
      {activeTab === 4 && <MealsTab />}
      {activeTab === 5 && <DocumentTypesTab />}
      {activeTab === 6 && <DivisionsTab />}
      {activeTab === 7 && <EntitiesTab />}
    </div>
  )
}
