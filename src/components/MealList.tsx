import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { addCook } from '../data/mutations'
import { useMealStats } from '../data/useMealStats'
import { fromISODate, fromMonthParam, weekDays, weekStartSaturday } from '../lib/dates'
import { cooksOnDate } from '../lib/planner'
import type { Cook, Meal, MealStats } from '../types'
import MealCard from './MealCard'
import MealDialog from './MealDialog'
import Popover from './Popover'

type MealListProps = {
  meals: Meal[]
  cooks: Cook[]
  loading: boolean
}

type SortKey = 'daysSince' | 'name' | 'servings' | 'timesCooked'

const SORT_LABELS: Record<SortKey, string> = {
  daysSince: 'Days since',
  name: 'Name',
  servings: 'Servings',
  timesCooked: 'Times cooked',
}

// A meal with no cooks at all has no entry in useMealStats' map.
const EMPTY_STATS: MealStats = {
  lastEaten: null,
  daysSince: null,
  timesCooked: 0,
  nextPlanned: null,
}

function sortMeals(meals: Meal[], statsFor: (meal: Meal) => MealStats, sortKey: SortKey): Meal[] {
  const sorted = [...meals]
  switch (sortKey) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'servings':
      return sorted.sort((a, b) => b.servings - a.servings)
    case 'timesCooked':
      return sorted.sort((a, b) => statsFor(b).timesCooked - statsFor(a).timesCooked)
    case 'daysSince':
      // Never-eaten sorts first, alongside the longest-overdue meals.
      return sorted.sort((a, b) => {
        const aDays = statsFor(a).daysSince ?? Infinity
        const bDays = statsFor(b).daysSince ?? Infinity
        return bDays - aDays
      })
  }
}

/** The left pane: every non-archived meal, searchable and sortable. See PLAN.md §6. */
export default function MealList({ meals, cooks, loading }: MealListProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('daysSince')
  const [sortOpen, setSortOpen] = useState(false)
  const [dialogState, setDialogState] = useState<{
    open: boolean
    meal: Meal | null
    /** Prefills the name when a search turned nothing up. */
    initialName?: string
  }>({ open: false, meal: null })

  const statsByMealId = useMealStats(cooks)
  const statsFor = useCallback(
    (meal: Meal) => statsByMealId.get(meal.id) ?? EMPTY_STATS,
    [statsByMealId],
  )

  const active = useMemo(() => meals.filter((meal) => !meal.archived), [meals])

  // A meal is planned onto the week the planner is showing, so the two panes
  // always agree about which eight days "this week" means.
  const { date, ym } = useParams()
  const days = useMemo(() => {
    const anchor = date ? fromISODate(date) : ym ? fromMonthParam(ym) : new Date()
    return weekDays(weekStartSaturday(anchor))
  }, [date, ym])

  function planMeal(mealId: string, iso: string) {
    addCook({ mealId, date: iso, kind: 'cook', order: cooksOnDate(cooks, iso).length })
  }

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = query ? active.filter((meal) => meal.name.toLowerCase().includes(query)) : active
    return sortMeals(filtered, statsFor, sortKey)
  }, [active, search, sortKey, statsFor])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b border-gray-200 px-3 pt-2.5 pb-2.5 md:space-y-3 md:px-4 md:pt-4 md:pb-3 dark:border-gray-800">
        {/* No title row on a phone: the bottom bar already names this pane, so
            the row it would take goes to the list. */}
        <div className="hidden items-center justify-between gap-2 md:flex">
          <h2 className="flex items-baseline gap-2 text-lg font-semibold">
            Meals
            {!loading && active.length > 0 && (
              <span className="text-sm font-normal text-gray-400 tabular-nums dark:text-gray-500">{active.length}</span>
            )}
          </h2>
          <button
            type="button"
            onClick={() => setDialogState({ open: true, meal: null })}
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-gray-900"
          >
            <span className="text-base leading-none">+</span>
            New meal
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            {/* 16px on a phone: anything smaller makes iOS zoom the page in on focus. */}
            <input
              type="search"
              placeholder="Search meals…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-base md:text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <Popover
            open={sortOpen}
            onClose={() => setSortOpen(false)}
            className="flex-shrink-0"
            panelClassName="w-52"
            sheetTitle="Sort meals by"
            trigger={
              <button
                type="button"
                onClick={() => setSortOpen((open) => !open)}
                aria-label={`Sort meals — currently ${SORT_LABELS[sortKey].toLowerCase()}`}
                aria-expanded={sortOpen}
                className="flex h-full items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-4 w-4 flex-shrink-0">
                  <path d="M7 4a1 1 0 0 1 1 1v11.59l1.3-1.3a1 1 0 0 1 1.4 1.42l-3 3a1 1 0 0 1-1.4 0l-3-3a1 1 0 0 1 1.4-1.42L6 16.6V5a1 1 0 0 1 1-1Zm7 1h7a1 1 0 1 1 0 2h-7a1 1 0 0 1 0-2Zm0 5h5a1 1 0 1 1 0 2h-5a1 1 0 1 1 0-2Zm0 5h3a1 1 0 1 1 0 2h-3a1 1 0 1 1 0-2Z" />
                </svg>
                <span className="hidden truncate lg:inline">{SORT_LABELS[sortKey]}</span>
              </button>
            }
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSortKey(key)
                  setSortOpen(false)
                }}
                aria-pressed={sortKey === key}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  sortKey === key ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {SORT_LABELS[key]}
                {sortKey === key && <span aria-hidden>✓</span>}
              </button>
            ))}
          </Popover>

          <button
            type="button"
            onClick={() => setDialogState({ open: true, meal: null })}
            aria-label="New meal"
            className="flex w-9.5 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900 text-xl leading-none text-white md:hidden dark:bg-white dark:text-gray-900"
          >
            +
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2.5 md:space-y-2 md:p-3">
        {loading ? (
          <MealListSkeleton />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <span className="text-4xl">{active.length === 0 ? '🍳' : '🔍'}</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {active.length === 0
                ? 'Your meal library is empty. Add the things you cook, then drag them onto a day.'
                : `No meals match “${search.trim()}”.`}
            </p>
            <button
              type="button"
              onClick={() =>
                setDialogState({ open: true, meal: null, initialName: search.trim() || undefined })
              }
              className="max-w-full truncate rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
            >
              {active.length === 0 ? 'Add your first meal' : `Create “${search.trim()}”`}
            </button>
          </div>
        ) : (
          visible.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              stats={statsFor(meal)}
              weekDays={days}
              onPlan={(iso) => planMeal(meal.id, iso)}
              onEdit={() => setDialogState({ open: true, meal })}
            />
          ))
        )}
      </div>

      {dialogState.open && (
        <MealDialog
          meal={dialogState.meal}
          initialName={dialogState.initialName}
          onClose={() => setDialogState({ open: false, meal: null })}
        />
      )}
    </div>
  )
}

/** Placeholder cards shown while the initial meal snapshot is still loading. */
function MealListSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="h-7 w-32 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="mt-3 h-3 w-44 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-7 w-10 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </>
  )
}
