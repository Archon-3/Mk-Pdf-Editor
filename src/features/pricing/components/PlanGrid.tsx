import type { Plan } from '../../../shared/types'
import { PlanCard } from './PlanCard'

type PlanGridProps = {
  plans: Plan[]
  className?: string
}

export function PlanGrid({ plans, className }: PlanGridProps) {
  return (
    <div className={className ?? 'plan-grid'}>
      {plans.map((plan) => (
        <PlanCard key={`${plan.name}-${plan.period}`} plan={plan} />
      ))}
    </div>
  )
}
