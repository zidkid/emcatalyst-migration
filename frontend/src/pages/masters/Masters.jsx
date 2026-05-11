import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { masterApi } from '../../api/endpoints'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'

const TABS = [
  'Doctors (MCL)', 'Specialities', 'HCP Roles', 'Therapeutics', 'States',
  'Brands', 'Meals', 'Cities', 'Document Types', 'Sponsorship Types',
]

const PAGE_SIZE = 50

// ---- Generic simple list tab ----
function SimpleListTab({ items = [], isLoading, onAdd, onToggle, addLabel, renderItem }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd(newName.trim())
    setNewName('')
    setShowAdd(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{items.length} items</p>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> {addLabel || 'Add'}
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4">
          <input
            className="input flex-1"
            placeholder="Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <button className="btn-primary px-3" onClick={handleAdd}><Check size={16} /></button>
          <button className="btn-secondary px-3" onClick={() => setShowAdd(false)}><X size={16} /></button>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                {renderItem && <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Details</th>}
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{item.name}</td>
                  {renderItem && <td className="px-4 py-2.5 text-gray-500 text-xs">{renderItem(item)}</td>}
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {onToggle && (
                      <button
                        className="text-xs text-gray-400 hover:text-gray-700"
                        onClick={() => onToggle(item)}
                      >
                        {item.is_active ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---- Doctors tab ----
function DoctorsTab() {
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedDoc, setSelectedDoc] = useState(null)

  const { data: states = [] } = useQuery({
    queryKey: ['master-states'],
    queryFn: () => masterApi.states().then(r => r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['doctors-all', search, stateFilter, page],
    queryFn: () => masterApi.hcpDoctorsAll({
      q: search || undefined,
      state: stateFilter || undefined,
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    }).then(r => r.data),
  })

  const doctors = Array.isArray(data) ? data : []

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, PAN, email, city…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input w-48" value={stateFilter} onChange={e => { setStateFilter(e.target.value); setPage(1) }}>
          <option value="">All States</option>
          {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'PAN', 'Qualification', 'City/State', 'Mobile', 'Type', 'HML', 'Hourly Rate', 'Max Cap', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {doctors.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDoc(d)}>
                  <td className="px-3 py-2 font-medium">{d.full_name || [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs text-blue-600">{d.pan_number || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{d.qualification || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{[d.city, d.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{d.mobile_number || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{d.doctor_type || '—'}</td>
                  <td className="px-3 py-2 text-center">
                    {d.hml && <span className="text-xs font-bold text-purple-600">{d.hml}</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {d.hourly_rate ? `₹${Number(d.hourly_rate).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {d.max_capping ? `₹${Number(d.max_capping).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-blue-600">View</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {doctors.length === PAGE_SIZE && (
            <div className="flex justify-between items-center px-4 py-3 border-t text-sm text-gray-500">
              <span>Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + doctors.length}</span>
              <div className="flex gap-2">
                <button className="btn-secondary py-1 px-3 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <button className="btn-secondary py-1 px-3 text-xs" onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Doctor detail modal */}
      <Modal open={!!selectedDoc} onClose={() => setSelectedDoc(null)} title="Doctor Details" size="md">
        {selectedDoc && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" value={selectedDoc.full_name} />
              <Field label="PAN" value={selectedDoc.pan_number} mono />
              <Field label="Qualification" value={selectedDoc.qualification} />
              <Field label="Doctor Type" value={selectedDoc.doctor_type} />
              <Field label="City" value={selectedDoc.city} />
              <Field label="State" value={selectedDoc.state} />
              <Field label="Mobile" value={selectedDoc.mobile_number} />
              <Field label="Email" value={selectedDoc.email} />
              <Field label="Hourly Rate" value={selectedDoc.hourly_rate ? `₹${Number(selectedDoc.hourly_rate).toLocaleString('en-IN')}` : null} />
              <Field label="Max Capping" value={selectedDoc.max_capping ? `₹${Number(selectedDoc.max_capping).toLocaleString('en-IN')}` : null} />
              <Field label="Bank Name" value={selectedDoc.bank_name} />
              <Field label="Account No" value={selectedDoc.account_number} mono />
              <Field label="IFSC Code" value={selectedDoc.ifsc_code} mono />
              <Field label="Name as per Bank" value={selectedDoc.name_as_per_bank} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`font-medium ${mono ? 'font-mono text-blue-700' : ''}`}>{value || '—'}</p>
    </div>
  )
}

// ---- Cities tab ----
function CitiesTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newCity, setNewCity] = useState('')
  const [newState, setNewState] = useState('')

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['master-cities', search],
    queryFn: () => masterApi.cities(search || undefined).then(r => r.data),
  })

  const create = useMutation({
    mutationFn: () => masterApi.createCity({ name: newCity, state: newState }),
    onSuccess: () => {
      qc.invalidateQueries(['master-cities'])
      setShowAdd(false)
      setNewCity('')
      setNewState('')
      toast.success('City added')
    },
    onError: () => toast.error('Error adding city'),
  })

  const toggle = useMutation({
    mutationFn: (city) => masterApi.updateCity(city.id, { is_active: !city.is_active }),
    onSuccess: () => qc.invalidateQueries(['master-cities']),
  })

  return (
    <div>
      <div className="flex gap-3 items-center mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="input pl-9" placeholder="Search cities…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <p className="text-sm text-gray-500">{cities.length} cities</p>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add City
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <input className="input flex-1" placeholder="City name" value={newCity}
            onChange={e => setNewCity(e.target.value)} autoFocus />
          <input className="input w-48" placeholder="State" value={newState}
            onChange={e => setNewState(e.target.value)} />
          <button className="btn-primary px-3" onClick={() => create.mutate()}><Check size={16} /></button>
          <button className="btn-secondary px-3" onClick={() => setShowAdd(false)}><X size={16} /></button>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">City</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">State</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cities.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{c.state || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="text-xs text-gray-400 hover:text-gray-700"
                      onClick={() => toggle.mutate(c)}>
                      {c.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---- Brands tab ----
function BrandsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTA, setNewTA] = useState('')

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['master-brands', search],
    queryFn: () => masterApi.brands(search || undefined).then(r => r.data),
  })

  const create = useMutation({
    mutationFn: () => masterApi.createBrand({ name: newName, therapeutic_area: newTA || undefined }),
    onSuccess: () => {
      qc.invalidateQueries(['master-brands'])
      setShowAdd(false)
      setNewName('')
      setNewTA('')
      toast.success('Brand added')
    },
    onError: () => toast.error('Error adding brand'),
  })

  const toggle = useMutation({
    mutationFn: (b) => masterApi.updateBrand(b.id, { is_active: !b.is_active }),
    onSuccess: () => qc.invalidateQueries(['master-brands']),
  })

  return (
    <div>
      <div className="flex gap-3 items-center mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="input pl-9" placeholder="Search brands…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <p className="text-sm text-gray-500">{brands.length} brands</p>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Brand
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <input className="input flex-1" placeholder="Brand name" value={newName}
            onChange={e => setNewName(e.target.value)} autoFocus />
          <input className="input w-48" placeholder="Therapeutic area" value={newTA}
            onChange={e => setNewTA(e.target.value)} />
          <button className="btn-primary px-3" onClick={() => create.mutate()}><Check size={16} /></button>
          <button className="btn-secondary px-3" onClick={() => setShowAdd(false)}><X size={16} /></button>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Brand Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Therapeutic Area</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {brands.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{b.name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{b.therapeutic_area || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="text-xs text-gray-400 hover:text-gray-700"
                      onClick={() => toggle.mutate(b)}>
                      {b.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---- Document Types tab ----
function DocumentTypesTab() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newMandatory, setNewMandatory] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['master-document-types-full'],
    queryFn: () => masterApi.documentTypesFull().then(r => r.data),
  })

  const create = useMutation({
    mutationFn: () => masterApi.createDocumentType({ name: newName, code: newCode || undefined, is_mandatory: newMandatory }),
    onSuccess: () => {
      qc.invalidateQueries(['master-document-types-full'])
      setShowAdd(false)
      setNewName('')
      setNewCode('')
      setNewMandatory(false)
      toast.success('Document type added')
    },
    onError: () => toast.error('Error adding document type'),
  })

  const toggle = useMutation({
    mutationFn: (item) => masterApi.updateDocumentType(item.id, { is_active: !item.is_active }),
    onSuccess: () => qc.invalidateQueries(['master-document-types-full']),
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{items.length} document types</p>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Document Type
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg flex-wrap">
          <input className="input w-48" placeholder="Code (e.g. CONSENT)" value={newCode}
            onChange={e => setNewCode(e.target.value)} autoFocus />
          <input className="input flex-1" placeholder="Name" value={newName}
            onChange={e => setNewName(e.target.value)} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={newMandatory} onChange={e => setNewMandatory(e.target.checked)} />
            Mandatory
          </label>
          <button className="btn-primary px-3" onClick={() => create.mutate()}><Check size={16} /></button>
          <button className="btn-secondary px-3" onClick={() => setShowAdd(false)}><X size={16} /></button>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Mandatory</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{item.code || '—'}</td>
                  <td className="px-4 py-2.5 font-medium">{item.name}</td>
                  <td className="px-4 py-2.5">
                    {item.is_mandatory ? <span className="text-xs text-red-600 font-medium">Required</span> : <span className="text-xs text-gray-400">Optional</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="text-xs text-gray-400 hover:text-gray-700"
                      onClick={() => toggle.mutate(item)}>
                      {item.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---- Sponsorship Types tab ----
function SponsorshipTypesTab() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['master-sponsorship-types'],
    queryFn: () => masterApi.sponsorshipTypes().then(r => r.data),
  })

  const create = useMutation({
    mutationFn: () => masterApi.createSponsorshipType({ name: newName, description: newDesc || undefined }),
    onSuccess: () => {
      qc.invalidateQueries(['master-sponsorship-types'])
      setShowAdd(false)
      setNewName('')
      setNewDesc('')
      toast.success('Sponsorship type added')
    },
    onError: () => toast.error('Error adding sponsorship type'),
  })

  const toggle = useMutation({
    mutationFn: (item) => masterApi.updateSponsorshipType(item.id, { is_active: !item.is_active }),
    onSuccess: () => qc.invalidateQueries(['master-sponsorship-types']),
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{items.length} sponsorship types</p>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <input className="input flex-1" placeholder="Name" value={newName}
            onChange={e => setNewName(e.target.value)} autoFocus />
          <input className="input flex-1" placeholder="Description (optional)" value={newDesc}
            onChange={e => setNewDesc(e.target.value)} />
          <button className="btn-primary px-3" onClick={() => create.mutate()}><Check size={16} /></button>
          <button className="btn-secondary px-3" onClick={() => setShowAdd(false)}><X size={16} /></button>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{item.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{item.description || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="text-xs text-gray-400 hover:text-gray-700"
                      onClick={() => toggle.mutate(item)}>
                      {item.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---- Main Masters page ----
export default function Masters() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)

  // Queries for simple tabs
  const { data: specialities = [], isLoading: specLoading } = useQuery({
    queryKey: ['master-specialities'],
    queryFn: () => masterApi.specialities().then(r => r.data),
  })
  const { data: hcpRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['master-hcp-roles'],
    queryFn: () => masterApi.hcpRoles().then(r => r.data),
  })
  const { data: therapeutics = [], isLoading: therLoading } = useQuery({
    queryKey: ['master-therapeutics'],
    queryFn: () => masterApi.therapeutics().then(r => r.data),
  })
  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ['master-states'],
    queryFn: () => masterApi.states().then(r => r.data),
  })
  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ['master-meals'],
    queryFn: () => masterApi.meals().then(r => r.data),
  })

  const createMeal = useMutation({
    mutationFn: (name) => masterApi.createMeal(name),
    onSuccess: () => { qc.invalidateQueries(['master-meals']); toast.success('Meal added') },
    onError: () => toast.error('Error adding meal'),
  })

  const toggleMeal = useMutation({
    mutationFn: (item) => masterApi.updateMeal(item.id, { is_active: !item.is_active }),
    onSuccess: () => qc.invalidateQueries(['master-meals']),
  })

  return (
    <div className="p-8">
      <PageHeader
        title="Master Data"
        subtitle="Reference data used across the application"
      />

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-6 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === i
                ? 'border-emcure-blue text-emcure-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && <DoctorsTab />}

      {activeTab === 1 && (
        <SimpleListTab
          items={specialities}
          isLoading={specLoading}
          addLabel="Add Speciality"
        />
      )}

      {activeTab === 2 && (
        <SimpleListTab
          items={hcpRoles}
          isLoading={rolesLoading}
          addLabel="Add HCP Role"
        />
      )}

      {activeTab === 3 && (
        <SimpleListTab
          items={therapeutics}
          isLoading={therLoading}
          addLabel="Add Therapeutic"
        />
      )}

      {activeTab === 4 && (
        <SimpleListTab
          items={states}
          isLoading={statesLoading}
          addLabel="Add State"
        />
      )}

      {activeTab === 5 && <BrandsTab />}

      {activeTab === 6 && (
        <SimpleListTab
          items={meals}
          isLoading={mealsLoading}
          addLabel="Add Meal"
          onAdd={(name) => createMeal.mutate(name)}
          onToggle={(item) => toggleMeal.mutate(item)}
        />
      )}

      {activeTab === 7 && <CitiesTab />}

      {activeTab === 8 && <DocumentTypesTab />}

      {activeTab === 9 && <SponsorshipTypesTab />}
    </div>
  )
}
