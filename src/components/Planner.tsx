import { format } from 'date-fns'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  formatWeekRange,
  formatWeekRangeShort,
  fromISODate,
  fromMonthParam,
  isCurrentMonth,
  isCurrentWeek,
  nextMonth,
  nextWeek,
  previousMonth,
  previousWeek,
  toISODate,
  toMonthParam,
  weekStartSaturday,
} from '../lib/dates'
import type { Cook, Meal } from '../types'
import MonthView from './MonthView'
import WeekView from './WeekView'

type PlannerProps = {
  meals: Meal[]
  cooks: Cook[]
}

const NAV_BUTTON =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-lg leading-none text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 md:h-9 md:w-9 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'

const VIEW_BUTTON = 'rounded-md px-2.5 py-1 text-xs font-medium transition-colors md:px-3 md:text-sm'

/**
 * The right pane. One toolbar carries everything that moves the planner
 * around — previous, next, today, and the week/month switch — so neither
 * view spends vertical space on navigation of its own. See PLAN.md §6.
 */
export default function Planner({ meals, cooks }: PlannerProps) {
  const { date, ym } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const view: 'week' | 'month' = location.pathname.startsWith('/month') ? 'month' : 'week'
  const anchor = date ? fromISODate(date) : ym ? fromMonthParam(ym) : new Date()
  const saturday = weekStartSaturday(anchor)

  const isWeek = view === 'week'
  const label = isWeek ? formatWeekRange(saturday) : format(anchor, 'MMMM yyyy')
  const shortLabel = isWeek ? formatWeekRangeShort(saturday) : format(anchor, 'MMM yyyy')
  const showingToday = isWeek ? isCurrentWeek(saturday) : isCurrentMonth(anchor)

  function goPrevious() {
    navigate(isWeek ? `/week/${toISODate(previousWeek(saturday))}` : `/month/${toMonthParam(previousMonth(anchor))}`)
  }

  function goNext() {
    navigate(isWeek ? `/week/${toISODate(nextWeek(saturday))}` : `/month/${toMonthParam(nextMonth(anchor))}`)
  }

  function goToday() {
    const now = new Date()
    navigate(isWeek ? `/week/${toISODate(weekStartSaturday(now))}` : `/month/${toMonthParam(now)}`)
  }

  return (
    <div className="flex h-full flex-col">
      {/* One row at every width: on a phone the label abbreviates rather than
          the toolbar wrapping onto a second line it cannot spare. */}
      <header className="flex flex-shrink-0 items-center gap-2 border-b border-gray-200 px-2.5 py-2 md:gap-4 md:px-6 md:py-3 dark:border-gray-800">
        <div className="flex flex-shrink-0 gap-1">
          <button
            type="button"
            onClick={goPrevious}
            aria-label={isWeek ? 'Previous week' : 'Previous month'}
            className={NAV_BUTTON}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label={isWeek ? 'Next week' : 'Next month'}
            className={NAV_BUTTON}
          >
            ›
          </button>
        </div>

        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold md:text-xl">
          <span className="md:hidden">{shortLabel}</span>
          <span className="hidden md:inline">{label}</span>
        </h2>

        <button
          type="button"
          onClick={goToday}
          disabled={showingToday}
          title={showingToday ? `Already showing this ${view}` : `Jump to the current ${view}`}
          className="flex-shrink-0 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent md:px-3 md:text-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Today
        </button>

        <div className="flex flex-shrink-0 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => navigate(`/week/${toISODate(saturday)}`)}
            aria-pressed={isWeek}
            className={`${VIEW_BUTTON} ${
              isWeek
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => navigate(`/month/${toMonthParam(anchor)}`)}
            aria-pressed={!isWeek}
            className={`${VIEW_BUTTON} ${
              !isWeek
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Month
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isWeek ? (
          <WeekView saturday={saturday} meals={meals} cooks={cooks} />
        ) : (
          <MonthView month={anchor} meals={meals} cooks={cooks} />
        )}
      </div>
    </div>
  )
}
