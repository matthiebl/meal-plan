import type { Category } from '../types'

export type CategoryGroup = 'protein' | 'carb'

/** Every category, in picker order: proteins, then carbs. See PLAN.md §5. */
export const CATEGORIES: { id: Category; label: string; group: CategoryGroup }[] = [
  { id: 'beef', label: 'Beef', group: 'protein' },
  { id: 'lamb', label: 'Lamb', group: 'protein' },
  { id: 'pork', label: 'Pork', group: 'protein' },
  { id: 'chicken', label: 'Chicken', group: 'protein' },
  { id: 'egg', label: 'Egg', group: 'protein' },
  { id: 'fish', label: 'Fish', group: 'protein' },
  { id: 'seafood', label: 'Seafood', group: 'protein' },
  { id: 'veggie', label: 'Veggie', group: 'protein' },
  { id: 'pasta', label: 'Pasta', group: 'carb' },
  { id: 'rice', label: 'Rice', group: 'carb' },
  { id: 'noodles', label: 'Noodles', group: 'carb' },
  { id: 'bread', label: 'Bread', group: 'carb' },
  { id: 'potato', label: 'Potato', group: 'carb' },
]

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<
  Category,
  string
>

// Written out per category so Tailwind's scanner can see each literal class
// name — a template-built string like `bg-${hue}-100` would never be
// generated. Backgrounds are opaque in both themes, because a secondary
// category's badge sits on top of the main tile and must not blend into it.
const TILE_CLASSES: Record<Category, string> = {
  beef: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  lamb: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300',
  pork: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  chicken: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  egg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  fish: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  seafood: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  veggie: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  pasta: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  rice: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  noodles: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  bread: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  potato: 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300',
}

// The category's colour at full strength, for marks too small to carry a
// tint: the month view's bars and dots.
const MARK_CLASSES: Record<Category, string> = {
  beef: 'bg-red-400',
  lamb: 'bg-fuchsia-400',
  pork: 'bg-pink-400',
  chicken: 'bg-amber-400',
  egg: 'bg-yellow-400',
  fish: 'bg-sky-400',
  seafood: 'bg-teal-400',
  veggie: 'bg-green-400',
  pasta: 'bg-orange-400',
  rice: 'bg-slate-400',
  noodles: 'bg-violet-400',
  bread: 'bg-stone-400',
  potato: 'bg-lime-400',
}

/** A tinted background and matching foreground: tiles, badges and category chips. */
export function tileClasses(category: Category | undefined): string {
  return category ? TILE_CLASSES[category] : 'bg-ink/[0.07] text-ink-3'
}

/** A solid mark in the category's colour. */
export function markClasses(category: Category | undefined): string {
  return category ? MARK_CLASSES[category] : 'bg-ink-3/50'
}
