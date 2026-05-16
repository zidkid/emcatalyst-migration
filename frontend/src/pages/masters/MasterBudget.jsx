import PageHeader from '../../components/ui/PageHeader'
import BudgetTab from './components/BudgetTab'

export default function MasterBudget() {
  return (
    <div className="p-8">
      <PageHeader title="Budget" subtitle="Manage budget master data" />
      <BudgetTab />
    </div>
  )
}
