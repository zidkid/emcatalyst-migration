import { statusBadgeClass } from '../../utils/helpers'

export default function StatusBadge({ status }) {
  return <span className={statusBadgeClass(status)}>{status}</span>
}
