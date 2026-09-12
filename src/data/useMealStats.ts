import { useMemo } from 'react'
import { daysSince, todayISODate } from '../lib/dates'
import type { Cook, MealStats } from '../types'

/** Derives the §4 statistics for every cooked meal from the cook list. */
export function useMealStats(cooks: Cook[]): Map<string, MealStats> {
  return useMemo(() => {
    const today = todayISODate()
    const byMeal = new Map<string, Cook[]>()
    for (const cook of cooks) {
      const list = byMeal.get(cook.mealId)
      if (list) list.push(cook)
      else byMeal.set(cook.mealId, [cook])
    }

    const stats = new Map<string, MealStats>()
    for (const [mealId, mealCooks] of byMeal) {
      let lastEaten: string | null = null
      let nextPlanned: string | null = null
      let timesCooked = 0

      for (const cook of mealCooks) {
        if (cook.kind === 'cook') timesCooked++
        if (cook.date <= today) {
          if (lastEaten === null || cook.date > lastEaten) lastEaten = cook.date
        } else if (nextPlanned === null || cook.date < nextPlanned) {
          nextPlanned = cook.date
        }
      }

      stats.set(mealId, {
        lastEaten,
        daysSince: lastEaten ? daysSince(lastEaten) : null,
        timesCooked,
        nextPlanned,
      })
    }

    return stats
  }, [cooks])
}
