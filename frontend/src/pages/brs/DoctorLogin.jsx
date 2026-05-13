import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { brsApi } from '../../api/endpoints'

export default function DoctorLogin() {
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginId || !password) { toast.error('Enter login ID and password'); return }
    setLoading(true)
    try {
      const res = await brsApi.doctorLogin(loginId, password)
      const { token } = res.data
      navigate(`/brs/survey/${token}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Doctor Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Login with credentials received via email</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Login ID</label>
            <input className="input" value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="e.g. brs_brs202506_1" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
