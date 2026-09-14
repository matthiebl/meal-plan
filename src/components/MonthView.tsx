import { format } from 'date-fns'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { markClasses } from '../lib/categories'
import {
  isSameMonthAs,
  isToday,
  monthGrid,
  toISODate,
  weekStartSaturday,
} from '../lib/dates'
import { cooksOnDate } from '../lib/planner'
import { useIsMobile } from '../lib/responsive'
import type { Cook, Meal } from '../types'
import Icon from './Icon'

type MonthViewProps = {
  month: Date
  meals: Meal[]
  cooks: Cook[]
}

/** Names beyond this are summarised, so a busy day never overflows its cell. */
const MAX_NAMES = 4

/** The same, for a phone's bars. */
const MAX_BARS = 3

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * A Sunday-to-Saturday, six-row grid for historical browsing. Not a drag
 * target; clicking a day switches to the week view containing it. See
 * PLAN.md §6.
 */
export default function MonthView({ month, meals, cooks }: MonthViewProps) {
  const navigate = useNavigate()
  // A phone's cell is too narrow for a meal name to survive truncation, so it
  // shows each cook as a bar in its category's colour instead.
  const isMobile = useIsMobile()

  const mealsById = useMemo(
    () => new Map(meals.map(meal => [meal.id, meal])),
    [meals],
  )
  const days = useMemo(() => monthGrid(month), [month])

  function goToDay(day: Date) {
    navigate(`/week/${toISODate(weekStartSaturday(day))}`)
  }

  return (
    <div className="flex h-full flex-col px-3 pb-3 md:px-4 md:pt-2 md:pb-4">
      <div className="grid shrink-0 grid-cols-7 gap-0.75 pb-1 text-center text-[11px] text-ink-3 md:text-left md:text-xs">
        {WEEKDAYS.map(label => (
          <div key={label} className="md:px-2">
            {isMobile ? label[0] : label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-0.75">
        {days.map(day => {
          const iso = toISODate(day)
          const inMonth = isSameMonthAs(day, month)
          const today = isToday(day)
          const dayCooks = cooksOnDate(cooks, iso)
          const max = isMobile ? MAX_BARS : MAX_NAMES
          const shown =
            dayCooks.length > max ? dayCooks.slice(0, max - 1) : dayCooks
          const hidden = dayCooks.length - shown.length

          return (
            <button
              key={iso}
              type="button"
              onClick={() => goToDay(day)}
              title={`Open the week of ${format(day, 'd MMMM yyyy')}`}
              className={`flex min-h-0 flex-col items-stretch gap-0.75 overflow-hidden rounded-[9px] p-1 text-left transition-colors md:gap-1 md:rounded-xl md:p-1.5 ${
                today ? 'bg-accent-soft' : 'hover:bg-surface-1'
              } ${inMonth ? '' : 'opacity-45'}`}
            >
              <span
                className={`text-center text-[11px] tabular-nums md:px-0.5 md:text-left md:text-xs ${
                  today
                    ? 'font-medium text-accent'
                    : inMonth
                      ? 'text-ink-2'
                      : 'text-ink-3'
                }`}
              >
                {format(day, 'd')}
              </span>

              {isMobile
                ? shown.map(cook => {
                    const meal = mealsById.get(cook.mealId)
                    if (!meal) return null
                    return (
                      <span
                        key={cook.id}
                        title={meal.name}
                        className={`h-1.25 shrink-0 rounded-full ${markClasses(meal.category?.main)} ${
                          cook.kind === 'leftovers' ? 'opacity-50' : ''
                        }`}
                      />
                    )
                  })
                : shown.map(cook => {
                    const meal = mealsById.get(cook.mealId)
                    if (!meal) return null
                    return (
                      <span
                        key={cook.id}
                        className={`flex min-w-0 items-center gap-1.5 px-0.5 text-xs text-ink-2 ${
                          cook.kind === 'leftovers' ? 'opacity-60' : ''
                        }`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${markClasses(meal.category?.main)}`}
                        />
                        {cook.kind === 'leftovers' && (
                          <Icon
                            name="leftovers"
                            className="-mr-1 h-3 w-3"
                            strokeWidth={2}
                          />
                        )}
                        <span className="truncate">{meal.name}</span>
                      </span>
                    )
                  })}
              {hidden > 0 && (
                <span className="text-center text-[11px] leading-none text-ink-3 md:pl-4 md:text-left md:text-xs">
                  +{hidden}
                  <span className="hidden md:inline"> more</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-2.5 ml-0.5 shrink-0 text-xs text-ink-3 md:hidden">
        Tap any day to open its week
      </p>
    </div>
  )
}
