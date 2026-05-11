import { format, parseISO } from 'date-fns'

export const fmtDate = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'dd MMM yyyy') }
  catch { return '—' }
}

export const fmtDateTime = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'dd MMM yyyy, HH:mm') }
  catch { return '—' }
}

export const fmtCurrency = (amount, currency = 'INR') => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

export const statusBadgeClass = (status) => {
  const s = (status || '').toLowerCase().replace(/\s+/g, '_')
  const map = {
    draft: 'badge-draft',
    submitted: 'badge-submitted',
    approved: 'badge-approved',
    active: 'badge-active',
    rejected: 'badge-rejected',
    pending: 'badge-pending',
    under_review: 'badge-submitted',
    compliance_approved: 'badge-active',
    finance_approved: 'badge-active',
    paid: 'badge-approved',
    expired: 'badge-rejected',
  }
  return map[s] || 'badge-draft'
}

export const getInitials = (firstName, lastName) => {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase() || 'U'
}
