import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fromISODate, fromMonthParam, toISODate, toMonthParam, weekStartSaturday } from '../lib/dates'
import type { Cook, Meal } from '../types'
import MonthView from './MonthView'
import WeekView from './WeekView'

type PlannerProps = {
  meals: Meal[]
  cooks: Cook[]
}

/**
 * The right pane: a view switch over the week and month views, each reading
 * its anchor date from the route. See PLAN.md §6.
 */
export default function Planner({ meals, cooks }: PlannerProps) {
  const { date, ym } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const view: 'week' | 'month' = location.pathname.startsWith('/month') ? 'month' : 'week'
  const anchor = date ? fromISODate(date) : ym ? fromMonthParam(ym) : new Date()
  const saturday = weekStartSaturday(anchor)

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 justify-center gap-1 border-b border-gray-200 p-2 dark:border-gray-800">
        <button
          type="button"
          onClick={() => navigate(`/week/${toISODate(saturday)}`)}
          aria-pressed={view === 'week'}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            view === 'week'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          Week
        </button>
        <button
          type="button"
          onClick={() => navigate(`/month/${toMonthParam(anchor)}`)}
          aria-pressed={view === 'month'}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            view === 'month'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          Month
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'week' ? (
          <WeekView saturday={saturday} meals={meals} cooks={cooks} />
        ) : (
          <MonthView month={anchor} meals={meals} cooks={cooks} />
        )}
      </div>
    </div>
  )
}
