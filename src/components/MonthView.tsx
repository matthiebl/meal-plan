import { format } from 'date-fns'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSameMonthAs, isToday, monthGrid, nextMonth, previousMonth, toISODate, toMonthParam, weekStartSaturday } from '../lib/dates'
import { cooksOnDate } from '../lib/planner'
import { dotClasses } from '../lib/visuals'
import type { Cook, Meal } from '../types'

type MonthViewProps = {
  month: Date
  meals: Meal[]
  cooks: Cook[]
}

/**
 * A Sunday-to-Saturday, six-row grid for historical browsing. Not a drag
 * target; clicking a day switches to the week view containing it. See
 * PLAN.md §6.
 */
export default function MonthView({ month, meals, cooks }: MonthViewProps) {
  const navigate = useNavigate()

  const mealsById = useMemo(() => new Map(meals.map((meal) => [meal.id, meal])), [meals])
  const days = useMemo(() => monthGrid(month), [month])

  function goToDay(day: Date) {
    navigate(`/week/${toISODate(weekStartSaturday(day))}`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-800">
        <button
          type="button"
          onClick={() => navigate(`/month/${toMonthParam(previousMonth(month))}`)}
          className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          ← Previous
        </button>
        <span className="text-sm font-medium">{format(month, 'MMMM yyyy')}</span>
        <button
          type="button"
          onClick={() => navigate(`/month/${toMonthParam(nextMonth(month))}`)}
          className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Next →
        </button>
      </div>

      <div className="grid flex-shrink-0 grid-cols-7 border-b border-gray-200 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:text-gray-600">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 overflow-y-auto">
        {days.map((day) => {
          const iso = toISODate(day)
          const inMonth = isSameMonthAs(day, month)
          const today = isToday(day)
          const dayCooks = cooksOnDate(cooks, iso)

          return (
            <button
              key={iso}
              type="button"
              onClick={() => goToDay(day)}
              className={`flex min-h-0 flex-col items-stretch gap-0.5 border-b border-r border-gray-200 p-1 text-left align-top hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 ${
                today ? 'bg-gray-100 dark:bg-gray-900' : ''
              }`}
            >
              <span
                className={`text-[11px] ${
                  inMonth
                    ? today
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-300 dark:text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                {dayCooks.map((cook) => {
                  const meal = mealsById.get(cook.mealId)
                  if (!meal) return null
                  return (
                    <span key={cook.id} className="flex min-w-0 items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotClasses(meal.visual.color)}`} />
                      <span className="truncate">{meal.name}</span>
                    </span>
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
