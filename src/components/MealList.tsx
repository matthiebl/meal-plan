import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { addCook } from '../data/mutations'
import { useMealStats } from '../data/useMealStats'
import { EMPTY_STATS, sortMeals, type SortKey } from '../lib/mealSort'
import { cooksOnDate } from '../lib/planner'
import { usePlannerRoute } from '../lib/plannerRoute'
import type { Cook, Meal } from '../types'
import Icon from './Icon'
import MealCard from './MealCard'
import MealDialog from './MealDialog'

type MealListProps = {
  meals: Meal[]
  cooks: Cook[]
  loading: boolean
  /** Sits at the right of the phone's title row — the theme toggle. */
  headerAction?: ReactNode
}

const SORT_LABELS: Record<SortKey, string> = {
  daysSince: 'Days since',
  name: 'Name',
  timesCooked: 'Times cooked',
}

/** The left pane: every non-archived meal, searchable and sortable. See PLAN.md §6. */
export default function MealList({ meals, cooks, loading, headerAction }: MealListProps) {
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

  // A meal is planned onto the week the planner is showing, so the two panes
  // always agree about which eight days "this week" means.
  const { days } = usePlannerRoute()

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
      <div className="flex-shrink-0 px-4 pt-4 pb-3 md:px-3.5 md:pt-3.5">
        {/* A title on a phone only: from `md` up the app header names the app,
            and the library needs no second heading beside the planner. */}
        <div className="mb-3 flex items-start justify-between gap-2 md:hidden">
          <div>
            <h2 className="text-xl font-medium">Meals</h2>
            <p className="mt-0.5 text-[13px] text-ink-3">
              {loading ? 'Loading…' : `${active.length} in your library`}
            </p>
          </div>
          {headerAction}
        </div>

        <div className="flex gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface-1 px-3 text-ink-3 focus-within:outline-2 focus-within:outline-accent md:rounded-[10px] md:px-2.5">
            <Icon name="search" className="h-4.5 w-4.5 md:h-4 md:w-4" />
            {/* 16px on a phone: anything smaller makes iOS zoom the page in on focus. */}
            <input
              type="search"
              placeholder="Search meals"
              aria-label="Search meals"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none md:h-9 md:text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => setDialogState({ open: true, meal: null })}
            aria-label="New meal"
            title="New meal"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary md:h-9 md:w-9 md:rounded-[10px]"
          >
            <Icon name="plus" strokeWidth={2.2} />
          </button>
        </div>

        <div role="group" aria-label="Sort meals by" className="mt-2.5 flex flex-wrap gap-1.5">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortKey(key)}
              aria-pressed={sortKey === key}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs transition-colors ${
                sortKey === key ? 'bg-accent-soft text-accent' : 'bg-surface-1 text-ink-2 hover:text-ink'
              }`}
            >
              {sortKey === key && <Icon name="arrow-down" className="h-3.5 w-3.5" strokeWidth={2} />}
              {SORT_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4 md:space-y-1.75 md:px-3.5">
        {loading ? (
          <MealListSkeleton />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-1 text-ink-3">
              <Icon name={active.length === 0 ? 'plate' : 'search'} className="h-7 w-7" />
            </span>
            <p className="text-sm text-ink-2">
              {active.length === 0
                ? 'Your meal library is empty. Add the things you cook, then plan them onto a day.'
                : `No meals match “${search.trim()}”.`}
            </p>
            <button
              type="button"
              onClick={() =>
                setDialogState({ open: true, meal: null, initialName: search.trim() || undefined })
              }
              className="max-w-full truncate rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary"
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
              headlineTimesCooked={sortKey === 'timesCooked'}
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
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl bg-surface-1 p-2 md:rounded-xl">
          <div className="h-12 w-12 rounded-xl bg-line md:h-10 md:w-10" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-28 rounded bg-line" />
            <div className="h-3 w-40 rounded bg-line" />
          </div>
        </div>
      ))}
    </>
  )
}
