import { format } from 'date-fns'
import type {
  Aisle,
  Cook,
  Extra,
  Ingredient,
  ItemState,
  Meal,
  Recipe,
} from '../types'
import {
  fromISODate,
  nextWeek,
  previousISODate,
  toISODate,
  weekStartSaturday,
} from './dates'
import { AISLES, aisleOf } from './ingredients'
import { BASE_UNITS, formatTotal, toBase, type BaseUnit } from './units'

/** A half-open ISO date range: `from` inclusive, `to` exclusive. */
export type ShopWindow = { from: string; to: string }

/**
 * The days one shop covers: this week's shop day up to, but not including,
 * the next week's. Saturday to Friday normally, Sunday to Saturday where the
 * shop has moved. Every day belongs to exactly one window, so no day is
 * shopped for twice and none is missed. See PLAN.md §4.
 */
export function shopWindow(
  thisShopDate: string,
  nextShopDate: string,
): ShopWindow {
  return { from: thisShopDate, to: nextShopDate }
}

/**
 * The week whose shop is next: this week's until Wednesday, then the coming
 * one. From midweek the list being built is the next shop's, not the one
 * already done. Keyed to the calendar weekday rather than to a moved
 * `shopDate`: it chooses which week to open, and `shopWindow` still decides
 * what that week's list covers. See PLAN.md §6.
 */
export function currentShopWeekSaturday(today = new Date()): string {
  const saturday = weekStartSaturday(today)
  const day = today.getDay()
  const midweek = day >= 3 && day <= 5
  return toISODate(midweek ? nextWeek(saturday) : saturday)
}

/** The half-open boundary, in one place. */
export function inShopWindow(date: string, { from, to }: ShopWindow): boolean {
  return date >= from && date < to
}

/** The window as its header names it: 'Sat 20 – Fri 26', with months where it crosses one. */
export function formatShopWindow({ from, to }: ShopWindow): string {
  const first = fromISODate(from)
  const last = fromISODate(previousISODate(to))
  const pattern = first.getMonth() === last.getMonth() ? 'EEE d' : 'EEE d MMM'
  return `${format(first, pattern)} – ${format(last, pattern)}`
}

/** The tap cycle: toGet → got → have → toGet. `null` is the absence of a stored key. */
export function nextItemState(state: ItemState | 'toGet'): ItemState | null {
  if (state === 'toGet') return 'got'
  if (state === 'got') return 'have'
  return null
}

export type ShoppingItem = {
  /** The key in the week's `shopping` map: an ingredient's id, or an extra's. */
  id: string
  name: string
  /**
   * The summed amount, rendered. One entry normally; two where one recipe
   * measured the ingredient and another counted it — rare, and honest when it
   * happens. Empty for an extra. See PLAN.md §3.
   */
  amounts: string[]
  state: ItemState | 'toGet'
}

export type AisleSection = {
  aisle: Aisle
  label: string
  items: ShoppingItem[]
}

/** A meal the window covers, and how many times it is cooked in it. */
export type WindowMeal = { meal: Meal; cooks: number }

export type ShoppingList = {
  window: ShopWindow
  /** Cooks in the window — the header's '· 7 meals'. A meal cooked twice counts twice. */
  cookCount: number
  /** The meals covered, first cooked first: the sheet's row of tiles. */
  meals: WindowMeal[]
  /** Those with no ingredients yet, named at the head of the list. */
  missing: Meal[]
  /** The aisle sections in walk order. An aisle with nothing in it is left out. */
  sections: AisleSection[]
  /** The week's ad-hoc items, in the order added. */
  extras: ShoppingItem[]
}

/**
 * The mealIds the window covers, for `useRecipes`. Separate from the list
 * itself because the recipes have to be fetched before the list can be built.
 */
export function mealIdsInWindow(cooks: Cook[], window: ShopWindow): string[] {
  const ids = new Set<string>()
  for (const cook of cooks) {
    if (cook.kind === 'cook' && inShopWindow(cook.date, window)) {
      ids.add(cook.mealId)
    }
  }
  return [...ids]
}

export type ShoppingInput = {
  window: ShopWindow
  cooks: Cook[]
  meals: Meal[]
  /** By mealId, from `useRecipes`. An absent entry is a meal with no recipe. */
  recipes: Map<string, Recipe>
  ingredients: Ingredient[]
  shopping: Record<string, ItemState>
  extras: Extra[]
}

/**
 * A week's shopping list, derived on the frontend exactly as the statistics in
 * PLAN.md §4 are. Nothing about it is denormalized. Call it only once the
 * recipes have loaded: a meal whose recipe is still in flight is
 * indistinguishable from one that has none.
 */
export function buildShoppingList({
  window,
  cooks,
  meals,
  recipes,
  ingredients,
  shopping,
  extras,
}: ShoppingInput): ShoppingList {
  const mealsById = new Map(meals.map(meal => [meal.id, meal]))
  const ingredientsById = new Map(
    ingredients.map(ingredient => [ingredient.id, ingredient]),
  )

  // The cooks the list covers: `kind: 'cook'` in the window. Leftovers are
  // ignored — they were bought for once already. A meal cooked twice in the
  // window counts twice. See PLAN.md §4.
  const counted = new Map<
    string,
    { meal: Meal; cooks: number; first: string }
  >()
  let cookCount = 0
  for (const cook of cooks) {
    if (cook.kind !== 'cook' || !inShopWindow(cook.date, window)) continue
    cookCount++
    const entry = counted.get(cook.mealId)
    if (entry) {
      entry.cooks++
      if (cook.date < entry.first) entry.first = cook.date
      continue
    }
    // Archived meals still hold their document, so they still shop. A meal
    // with no document at all cannot be named or costed.
    const meal = mealsById.get(cook.mealId)
    if (meal) counted.set(cook.mealId, { meal, cooks: 1, first: cook.date })
  }

  const windowMeals = [...counted.values()].sort(
    (a, b) =>
      a.first.localeCompare(b.first) || a.meal.name.localeCompare(b.meal.name),
  )

  // Amounts sum per ingredient and base unit. A base unit is a family's
  // identity, and each count unit is its own base, so `2 each` never merges
  // with `2 cloves`. See lib/units.ts.
  const totals = new Map<string, Map<BaseUnit, number>>()
  const missing: Meal[] = []

  for (const { meal, cooks: times } of windowMeals) {
    const items = recipes.get(meal.id)?.items ?? []
    if (items.length === 0) {
      // A list that silently leaves out half the week is worse than no list.
      missing.push(meal)
      continue
    }
    for (const item of items) {
      const { amount, base } = toBase(item.amount, item.unit)
      let byBase = totals.get(item.ingredientId)
      if (!byBase) {
        byBase = new Map()
        totals.set(item.ingredientId, byBase)
      }
      byBase.set(base, (byBase.get(base) ?? 0) + amount * times)
    }
  }

  const byAisle = new Map<Aisle, ShoppingItem[]>()
  for (const [ingredientId, byBase] of totals) {
    // Ingredients are never deleted; an id with no ingredient means the table
    // has not loaded, and the sheet waits for it rather than naming nothing.
    const ingredient = ingredientsById.get(ingredientId)
    if (!ingredient) continue

    // `some` says nothing where the same ingredient also carries a measured
    // amount, so it is dropped. Alone, it is the whole line. See PLAN.md §3.
    const entries = [...byBase.entries()]
    const measured = entries.filter(([base]) => base !== 'some')
    const shown = (measured.length > 0 ? measured : entries).sort(
      ([a], [b]) => BASE_UNITS.indexOf(a) - BASE_UNITS.indexOf(b),
    )

    const aisle = aisleOf(ingredient)
    const item: ShoppingItem = {
      id: ingredientId,
      name: ingredient.name,
      amounts: shown.map(([base, amount]) => formatTotal(amount, base)),
      state: shopping[ingredientId] ?? 'toGet',
    }
    const items = byAisle.get(aisle)
    if (items) items.push(item)
    else byAisle.set(aisle, [item])
  }

  const sections = AISLES.flatMap(({ id, label }) => {
    const items = byAisle.get(id)
    if (!items) return []
    // Alphabetical within an aisle: the order must not move as amounts change
    // or as items are ticked off.
    items.sort((a, b) => a.name.localeCompare(b.name))
    return [{ aisle: id, label, items }]
  })

  return {
    window,
    cookCount,
    meals: windowMeals.map(({ meal, cooks: times }) => ({
      meal,
      cooks: times,
    })),
    missing,
    sections,
    extras: extras.map(extra => ({
      id: extra.id,
      name: extra.name,
      amounts: [],
      state: shopping[extra.id] ?? 'toGet',
    })),
  }
}
