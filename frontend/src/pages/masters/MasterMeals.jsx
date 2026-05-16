import PageHeader from '../../components/ui/PageHeader'
import MealsTab from './components/MealsTab'

export default function MasterMeals() {
  return (
    <div className="p-8">
      <PageHeader title="Meals" subtitle="Manage meal master data" />
      <MealsTab />
    </div>
  )
}
