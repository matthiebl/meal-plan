import { usePlannerRoute } from '../lib/plannerRoute'
import type { Cook, Ingredient, Meal } from '../types'
import MonthView from './MonthView'
import { PlannerMobileHeader } from './PlannerToolbar'
import WeekView from './WeekView'

type PlannerProps = {
  meals: Meal[]
  cooks: Cook[]
  ingredients: Ingredient[]
}

/**
 * The right pane: the week or month view. From `md` up its toolbar lives in
 * the app header; on a phone, where there is no app header, the pane carries
 * its own. See PLAN.md §6.
 */
export default function Planner({ meals, cooks, ingredients }: PlannerProps) {
  const { isWeek, anchor, saturday } = usePlannerRoute()

  return (
    <div className="flex h-full flex-col">
      <div className="md:hidden">
        <PlannerMobileHeader />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isWeek ? (
          <WeekView
            saturday={saturday}
            meals={meals}
            cooks={cooks}
            ingredients={ingredients}
          />
        ) : (
          <MonthView month={anchor} meals={meals} cooks={cooks} />
        )}
      </div>
    </div>
  )
}
