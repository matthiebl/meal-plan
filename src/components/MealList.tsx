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
  const [dialogState, setDialogState] = useState<{ open: boolean; meal: Meal | null }>({
    open: false,
    meal: null,
  })

  const statsByMealId = useMealStats(cooks)
  const statsFor = useCallback(
    (meal: Meal) => statsByMealId.get(meal.id) ?? EMPTY_STATS,
    [statsByMealId],
  )

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    const active = meals.filter((meal) => !meal.archived)
    const filtered = query ? active.filter((meal) => meal.name.toLowerCase().includes(query)) : active
    return sortMeals(filtered, statsFor, sortKey)
  }, [meals, search, sortKey, statsFor])

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Meals</h2>
        <button
          type="button"
          onClick={() => setDialogState({ open: true, meal: null })}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
        >
          + New meal
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          type="search"
          placeholder="Search meals…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
        >
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {loading ? (
          <MealListSkeleton />
        ) : (
          <>
            {visible.length === 0 && (
              <p className="p-4 text-center text-sm text-gray-400 dark:text-gray-600">
                {meals.length === 0 ? 'No meals yet.' : 'No meals match your search.'}
              </p>
            )}
            {visible.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                stats={statsFor(meal)}
                onEdit={() => setDialogState({ open: true, meal })}
              />
            ))}
          </>
        )}
      </div>

      {dialogState.open && (
        <MealDialog meal={dialogState.meal} onClose={() => setDialogState({ open: false, meal: null })} />
      )}
    </div>
  )
}

/** Placeholder cards shown while the initial meal snapshot is still loading. */
function MealListSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-200 p-3 dark:border-gray-800"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-6 w-28 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="mt-3 flex gap-4">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </>
  )
}
