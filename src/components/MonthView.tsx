import { format } from 'date-fns'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSameMonthAs, isToday, monthGrid, toISODate, weekStartSaturday } from '../lib/dates'
import { cooksOnDate } from '../lib/planner'
import { useIsMobile } from '../lib/responsive'
import { LEFTOVERS_PREFIX, dotClasses } from '../lib/visuals'
import type { Cook, Meal } from '../types'

type MonthViewProps = {
  month: Date
  meals: Meal[]
  cooks: Cook[]
}

/** Chips beyond this are summarised, so a busy day never overflows its cell. */
const MAX_CHIPS = 4

/** The same, for a phone's dots — which are a row, not a stack. */
const MAX_DOTS = 6

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * A Sunday-to-Saturday, six-row grid for historical browsing. Not a drag
 * target; clicking a day switches to the week view containing it. See
 * PLAN.md §6.
 */
export default function MonthView({ month, meals, cooks }: MonthViewProps) {
  const navigate = useNavigate()
  // A phone's cell is too narrow for a meal name to survive truncation, so it
  // shows each cook as its colour dot instead.
  const isMobile = useIsMobile()

  const mealsById = useMemo(() => new Map(meals.map((meal) => [meal.id, meal])), [meals])
  const days = useMemo(() => monthGrid(month), [month])

  function goToDay(day: Date) {
    navigate(`/week/${toISODate(weekStartSaturday(day))}`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="grid flex-shrink-0 grid-cols-7 border-b border-gray-200 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:text-gray-500">
        {WEEKDAYS.map((label) => (
          <div key={label} className="py-1.5 md:py-2">
            {isMobile ? label[0] : label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const iso = toISODate(day)
          const inMonth = isSameMonthAs(day, month)
          const today = isToday(day)
          const dayCooks = cooksOnDate(cooks, iso)
          const max = isMobile ? MAX_DOTS : MAX_CHIPS
          const shown = dayCooks.length > max ? dayCooks.slice(0, max - 1) : dayCooks
          const hidden = dayCooks.length - shown.length

          return (
            <button
              key={iso}
              type="button"
              onClick={() => goToDay(day)}
              title={`Open the week of ${format(day, 'd MMMM yyyy')}`}
              className={`flex min-h-0 flex-col items-stretch gap-0.5 overflow-hidden border-b border-r border-gray-100 p-1 text-left align-top transition-colors hover:bg-gray-50 md:gap-1 md:p-1.5 dark:border-gray-800 dark:hover:bg-gray-800/50 ${
                inMonth ? '' : 'bg-gray-50/60 dark:bg-gray-950/40'
              }`}
            >
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs tabular-nums md:h-7 md:w-7 md:text-sm ${
                  today
                    ? 'bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900'
                    : inMonth
                      ? 'font-medium text-gray-700 dark:text-gray-200'
                      : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                {format(day, 'd')}
              </span>

              {isMobile ? (
                <div className="flex min-h-0 min-w-0 flex-1 flex-wrap content-start items-center gap-1">
                  {shown.map((cook) => {
                    const meal = mealsById.get(cook.mealId)
                    if (!meal) return null
                    return (
                      <span
                        key={cook.id}
                        title={meal.name}
                        className={`h-2.5 w-2.5 rounded-full ${dotClasses(meal.visual.color)} ${
                          cook.kind === 'leftovers' ? 'opacity-50' : ''
                        }`}
                      />
                    )
                  })}
                  {hidden > 0 && (
                    <span className="text-[10px] leading-none text-gray-400 dark:text-gray-500">+{hidden}</span>
                  )}
                </div>
              ) : (
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-hidden">
                  {shown.map((cook) => {
                    const meal = mealsById.get(cook.mealId)
                    if (!meal) return null
                    return (
                      <span
                        key={cook.id}
                        className={`flex min-w-0 items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 ${
                          cook.kind === 'leftovers' ? 'opacity-60' : ''
                        }`}
                      >
                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotClasses(meal.visual.color)}`} />
                        <span className="truncate">
                          {cook.kind === 'leftovers' ? `${LEFTOVERS_PREFIX} ` : ''}
                          {meal.name}
                        </span>
                      </span>
                    )
                  })}
                  {hidden > 0 && (
                    <span className="pl-3.5 text-xs text-gray-400 dark:text-gray-500">+{hidden} more</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
