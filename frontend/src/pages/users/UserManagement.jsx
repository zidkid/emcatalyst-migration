import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Users, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi, masterApi } from '../../api/endpoints'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'

const ROLES = [
  'Administrator', 'ComplianceUser', 'DivisionCoOrdinator', 'FinanceUser',
  'GSTuser', 'OPEXUser', 'User', 'FunctionalUser', 'MyAdmin', 'Anonymous'
]

const PAGE_SIZE = 50

export default function UserManagement() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [newUserModal, setNewUserModal] = useState(false)
  const [editRoleModal, setEditRoleModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [editRole, setEditRole] = useState('')
  const { register, handleSubmit, reset } = useForm()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.listUsers().then(r => r.data),
  })

  const { data: divisions = [] } = useQuery({
    queryKey: ['master-divisions'],
    queryFn: () => masterApi.divisions().then(r => r.data),
  })

  const divisionMap = Object.fromEntries(divisions.map(d => [d.id, d.name]))

  const createUser = useMutation({
    mutationFn: (data) => authApi.createUser(data),
    onSuccess: () => { qc.invalidateQueries(['users']); setNewUserModal(false); reset(); toast.success('User created') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error creating user'),
  })

  const updateUser = useMutation({
    mutationFn: ({ id, data }) => authApi.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries(['users']); setEditRoleModal(false); toast.success('User updated') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error'),
  })

  const filtered = users.filter(u =>
    !search || `${u.first_name} ${u.last_name} ${u.email} ${u.employee_id || ''} ${u.department || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(1)
  }

  const openEditRole = (u) => {
    setEditUser(u)
    setEditRole(u.role)
    setEditRoleModal(true)
  }

  return (
    <div className="p-8">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} users · ${divisions.length} divisions`}
        actions={
          <button className="btn-primary flex items-center gap-2" onClick={() => setNewUserModal(true)}>
            <Plus size={16} /> New User
          </button>
        }
      />

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, employee ID, department…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        {filtered.length !== users.length && (
          <span className="text-sm text-gray-500 self-center">{filtered.length} results</span>
        )}
      </div>

      {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Emp ID', 'Name', 'Email', 'Division', 'Department', 'Role', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{u.employee_id || '—'}</td>
                    <td className="px-4 py-2.5 font-medium">
                      {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                      {u.designation_title && (
                        <span className="block text-xs text-gray-400">{u.designation_title}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{divisionMap[u.division_id] || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{u.department || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{u.role}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          onClick={() => openEditRole(u)}
                        >
                          <Edit2 size={12} /> Role
                        </button>
                        <button
                          className="text-xs text-gray-400 hover:text-gray-700 hover:underline"
                          onClick={() => updateUser.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <button
                  className="btn-secondary py-1 px-2 text-xs"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const pg = i + 1
                  return (
                    <button
                      key={pg}
                      className={`py-1 px-2.5 rounded text-xs ${pg === page ? 'bg-blue-600 text-white' : 'btn-secondary'}`}
                      onClick={() => setPage(pg)}
                    >
                      {pg}
                    </button>
                  )
                })}
                {totalPages > 10 && <span className="text-xs text-gray-400 self-center px-1">…{totalPages}</span>}
                <button
                  className="btn-secondary py-1 px-2 text-xs"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Role Modal */}
      <Modal open={editRoleModal} onClose={() => setEditRoleModal(false)} title="Edit User Role">
        {editUser && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                {[editUser.first_name, editUser.last_name].filter(Boolean).join(' ')}
              </p>
              <p className="text-xs text-gray-500">{editUser.email}</p>
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={editRole} onChange={e => setEditRole(e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Active</label>
              <select className="input" defaultValue={editUser.is_active ? 'true' : 'false'} id="active-select">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setEditRoleModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={() => updateUser.mutate({
                  id: editUser.id,
                  data: {
                    role: editRole,
                    is_active: document.getElementById('active-select').value === 'true',
                  }
                })}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* New User Modal */}
      <Modal open={newUserModal} onClose={() => setNewUserModal(false)} title="New User" size="md">
        <form onSubmit={handleSubmit(d => createUser.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name</label><input className="input" {...register('first_name')} /></div>
            <div><label className="label">Last Name</label><input className="input" {...register('last_name')} /></div>
            <div className="col-span-2">
              <label className="label">Email *</label>
              <input type="email" className="input" {...register('email', { required: true })} />
            </div>
            <div>
              <label className="label">Employee ID</label>
              <input className="input" {...register('employee_id')} />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" {...register('password', { required: true })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" {...register('role')}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Division</label>
              <select className="input" {...register('division_id')}>
                <option value="">None</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Designation</label>
            <input className="input" {...register('designation_title')} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setNewUserModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
