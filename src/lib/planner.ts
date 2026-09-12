import type { Cook } from '../types'

/** A day's cooks, sorted by their order. */
export function cooksOnDate(cooks: Cook[], date: string): Cook[] {
  return cooks.filter((cook) => cook.date === date).sort((a, b) => a.order - b.order)
}
