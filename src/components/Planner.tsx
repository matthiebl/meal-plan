import { useParams } from 'react-router-dom'
import { fromISODate, fromMonthParam, weekStartSaturday } from '../lib/dates'
import type { Cook, Meal } from '../types'
import WeekView from './WeekView'

type PlannerProps = {
  meals: Meal[]
  cooks: Cook[]
}

/** The right pane: the week containing the routed date, defaulting to today. See PLAN.md §6. */
export default function Planner({ meals, cooks }: PlannerProps) {
  const { date, ym } = useParams()
  const anchor = date ? fromISODate(date) : ym ? fromMonthParam(ym) : new Date()
  const saturday = weekStartSaturday(anchor)

  return <WeekView saturday={saturday} meals={meals} cooks={cooks} />
}
