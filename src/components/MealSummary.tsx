import { formatNearDay } from '../lib/dates'
import type { Meal, MealStats } from '../types'
import CategoryChips from './CategoryChips'
import MealTile from './MealTile'

type MealSummaryProps = {
  meal: Meal
  stats: MealStats
  /** Makes times cooked the headline figure, in place of days since. */
  headlineTimesCooked?: boolean
}

/**
 * The contents of a meal card: its tile, name, category chips and servings,
 * and a §4 statistic as the headline figure at its right. The figure is days
 * since by default, or times cooked — except that a meal already planned
 * shows its planned day instead of days since, which is then the more useful
 * thing to see. Shared by the library and the day picker. See PLAN.md §6.
 */
export default function MealSummary({ meal, stats, headlineTimesCooked = false }: MealSummaryProps) {
  return (
    <>
      <MealTile category={meal.category} size="card" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium md:text-sm">{meal.name}</p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
          <CategoryChips category={meal.category} />
          <span className="truncate text-[13px] text-ink-2 md:text-xs">Serves {meal.servings}</span>
        </div>
      </div>

      <div className="flex-shrink-0 pr-1 text-right">
        {headlineTimesCooked ? (
          <>
            <p className="text-base leading-tight font-medium tabular-nums md:text-sm">{stats.timesCooked}×</p>
            <p className="text-[11px] text-ink-3">cooked</p>
          </>
        ) : stats.nextPlanned ? (
          <>
            <p className="text-xs text-accent md:text-[11px]">Planned</p>
            <p className="text-[11px] text-ink-3">{formatNearDay(stats.nextPlanned)}</p>
          </>
        ) : stats.daysSince === null ? (
          <p className="text-xs text-ink-3 md:text-[11px]">New</p>
        ) : stats.daysSince === 0 ? (
          <p className="text-xs font-medium md:text-[11px]">Today</p>
        ) : (
          <>
            <p className="text-base leading-tight font-medium tabular-nums md:text-sm">{stats.daysSince}</p>
            <p className="text-[11px] text-ink-3">{stats.daysSince === 1 ? 'day' : 'days'}</p>
          </>
        )}
      </div>
    </>
  )
}

/** The card surface around a MealSummary; planned meals carry an accent outline. */
export const MEAL_CARD_CLASSES =
  'flex w-full items-center gap-3 rounded-2xl bg-surface-1 p-2 text-left md:gap-2.5 md:rounded-xl md:p-1.75'

export const PLANNED_OUTLINE = 'shadow-[inset_0_0_0_1.5px_var(--color-accent)]'
