import type { Meal, MealStats } from '../types'

export type SortKey = 'daysSince' | 'name' | 'timesCooked'

/** A meal with no cooks at all has no entry in useMealStats' map; these are its statistics. */
export const EMPTY_STATS: MealStats = {
  lastEaten: null,
  daysSince: null,
  timesCooked: 0,
  nextPlanned: null,
}

/** Sorts meals for the library and the day picker. See PLAN.md §6. */
export function sortMeals(
  meals: Meal[],
  statsFor: (meal: Meal) => MealStats,
  sortKey: SortKey,
): Meal[] {
  const sorted = [...meals]
  switch (sortKey) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'timesCooked':
      return sorted.sort(
        (a, b) => statsFor(b).timesCooked - statsFor(a).timesCooked,
      )
    case 'daysSince':
      // Never-eaten sorts first, alongside the longest-overdue meals.
      return sorted.sort((a, b) => {
        const aDays = statsFor(a).daysSince ?? Infinity
        const bDays = statsFor(b).daysSince ?? Infinity
        return bDays - aDays
      })
  }
}
