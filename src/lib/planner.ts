import { differenceInCalendarDays, format } from 'date-fns'
import type { Cook } from '../types'
import { fromISODate } from './dates'

/** A day's cooks, sorted by their order. */
export function cooksOnDate(cooks: Cook[], date: string): Cook[] {
  return cooks
    .filter(cook => cook.date === date)
    .sort((a, b) => a.order - b.order)
}

/**
 * The line beneath each cook's name in the phone week: how long the meal had
 * gone uncooked by that day, or for leftovers, the day they came from. It is
 * measured to the cook's own date, not to today, so it reads the same for a
 * plan as for a record. See PLAN.md §6.
 */
export function cookDetails(
  cooks: Cook[],
  forCooks: Cook[],
): Map<string, string> {
  const cookDatesByMeal = new Map<string, string[]>()
  for (const cook of cooks) {
    if (cook.kind !== 'cook') continue
    const dates = cookDatesByMeal.get(cook.mealId)
    if (dates) dates.push(cook.date)
    else cookDatesByMeal.set(cook.mealId, [cook.date])
  }
  const cooksById = new Map(cooks.map(cook => [cook.id, cook]))

  const details = new Map<string, string>()
  for (const cook of forCooks) {
    if (cook.kind === 'leftovers') {
      const from = cook.fromCookId ? cooksById.get(cook.fromCookId) : undefined
      if (!from) {
        details.set(cook.id, 'Leftovers')
        continue
      }
      const gap = differenceInCalendarDays(
        fromISODate(cook.date),
        fromISODate(from.date),
      )
      details.set(
        cook.id,
        `Leftovers from ${format(fromISODate(from.date), gap >= 0 && gap < 7 ? 'EEE' : 'd MMM')}`,
      )
      continue
    }
    let previous: string | null = null
    for (const date of cookDatesByMeal.get(cook.mealId) ?? []) {
      if (date < cook.date && (previous === null || date > previous))
        previous = date
    }
    if (previous === null) {
      details.set(cook.id, 'first time cooked')
    } else {
      const days = differenceInCalendarDays(
        fromISODate(cook.date),
        fromISODate(previous),
      )
      details.set(
        cook.id,
        `${days} ${days === 1 ? 'day' : 'days'} since last cooked`,
      )
    }
  }
  return details
}
