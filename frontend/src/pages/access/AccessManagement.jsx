import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { accessApi } from '../../api/endpoints'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'

export default function AccessManagement() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('divisions')
  const [newDivModal, setNewDivModal] = useState(false)
  const [newCCModal, setNewCCModal] = useState(false)
  const [divName, setDivName] = useState('')
  const [divCode, setDivCode] = useState('')
  const [ccId, setCcId] = useState('')
  const [ccName, setCcName] = useState('')
  const [ccDivId, setCcDivId] = useState('')

  const { data: divisions = [], isLoading: divLoading } = useQuery({ queryKey: ['divisions'], queryFn: () => accessApi.listDivisions().then(r => r.data) })
  const { data: costCenters = [], isLoading: ccLoading } = useQuery({ queryKey: ['cost-centers'], queryFn: () => accessApi.listCostCenters().then(r => r.data) })
  const { data: functions_ = [], isLoading: fnLoading } = useQuery({ queryKey: ['functions'], queryFn: () => accessApi.listFunctions().then(r => r.data) })

  const createDiv = useMutation({
    mutationFn: () => accessApi.createDivision(divName, divCode),
    onSuccess: () => { qc.invalidateQueries(['divisions']); setNewDivModal(false); toast.success('Division created') },
  })
  const createCC = useMutation({
    mutationFn: () => accessApi.createCostCenter({ cost_center_id: ccId, name: ccName, division_id: ccDivId || undefined }),
    onSuccess: () => { qc.invalidateQueries(['cost-centers']); setNewCCModal(false); toast.success('Cost center created') },
  })

  return (
    <div className="p-8">
      <PageHeader title="Access Management" subtitle="Manage divisions, cost centers, functions, and territories" />

      <div className="flex gap-1 border-b mb-6">
        {[['divisions','Divisions'],['cost-centers','Cost Centers'],['functions','Functions']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? 'border-emcure-blue text-emcure-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {activeTab === 'divisions' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="btn-primary flex items-center gap-2" onClick={() => setNewDivModal(true)}><Plus size={14} /> New Division</button>
          </div>
          {divLoading ? <LoadingSpinner /> : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b"><tr>{['ID','Code','Name','Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y">{divisions.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{d.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{d.code}</td>
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3"><span className={d.is_active ? 'badge-active' : 'badge-rejected'}>{d.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cost-centers' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="btn-primary flex items-center gap-2" onClick={() => setNewCCModal(true)}><Plus size={14} /> New Cost Center</button>
          </div>
          {ccLoading ? <LoadingSpinner /> : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b"><tr>{['CC ID','Name','Division','Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y">{costCenters.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{c.cost_center_id}</td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.division_id || '—'}</td>
                    <td className="px-4 py-3"><span className={c.is_active ? 'badge-active' : 'badge-rejected'}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'functions' && (
        fnLoading ? <LoadingSpinner /> : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>{['ID','Code','Name'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{functions_.map(f => (
                <tr key={f.id}><td className="px-4 py-3 text-gray-400">{f.id}</td><td className="px-4 py-3 font-mono text-xs">{f.code}</td><td className="px-4 py-3">{f.name}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )
      )}

      <Modal open={newDivModal} onClose={() => setNewDivModal(false)} title="New Division" size="sm">
        <div className="space-y-3">
          <div><label className="label">Division Name *</label><input className="input" value={divName} onChange={e => setDivName(e.target.value)} /></div>
          <div><label className="label">Code</label><input className="input" value={divCode} onChange={e => setDivCode(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setNewDivModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => createDiv.mutate()} disabled={!divName}>Create</button>
          </div>
        </div>
      </Modal>

      <Modal open={newCCModal} onClose={() => setNewCCModal(false)} title="New Cost Center" size="sm">
        <div className="space-y-3">
          <div><label className="label">Cost Center ID *</label><input className="input" value={ccId} onChange={e => setCcId(e.target.value)} /></div>
          <div><label className="label">Name *</label><input className="input" value={ccName} onChange={e => setCcName(e.target.value)} /></div>
          <div><label className="label">Division</label>
            <select className="input" value={ccDivId} onChange={e => setCcDivId(e.target.value)}>
              <option value="">None</option>
              {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setNewCCModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => createCC.mutate()} disabled={!ccId || !ccName}>Create</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
