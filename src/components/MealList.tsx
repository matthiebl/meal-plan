import { useCallback, useMemo, useState } from 'react'
import { useMealStats } from '../data/useMealStats'
import type { Cook, Meal, MealStats } from '../types'
import MealCard from './MealCard'
import MealDialog from './MealDialog'

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

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = query ? active.filter((meal) => meal.name.toLowerCase().includes(query)) : active
    return sortMeals(filtered, statsFor, sortKey)
  }, [active, search, sortKey, statsFor])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 space-y-3 border-b border-gray-200 px-4 pt-4 pb-3 dark:border-gray-800">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-baseline gap-2 text-lg font-semibold">
            Meals
            {!loading && active.length > 0 && (
              <span className="text-sm font-normal text-gray-400 tabular-nums dark:text-gray-500">
                {active.length}
              </span>
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
            <input
              type="search"
              placeholder="Search meals…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort meals"
            title="Sort meals"
            className="flex-shrink-0 rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            {Object.entries(SORT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
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
