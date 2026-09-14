import type { Timestamp } from 'firebase/firestore'

/** The closed set of meal categories: what a meal is built on. See PLAN.md §5. */
export type Category =
  | 'beef'
  | 'lamb'
  | 'pork'
  | 'chicken'
  | 'egg'
  | 'fish'
  | 'seafood'
  | 'veggie'
  | 'pasta'
  | 'rice'
  | 'noodles'
  | 'bread'
  | 'potato'

export type MealCategory = {
  /** What the meal is mostly — its tile's colour and icon. */
  main: Category
  /** What it is served with, if anything worth naming. Never equal to `main`. */
  secondary?: Category
}

/** meals/{mealId} */
export type Meal = {
  id: string
  name: string
  /** Estimated servings per cook. */
  servings: number
  /** Absent until a category is picked; the meal renders as uncategorised. */
  category?: MealCategory
  /** Soft delete; history continues to render. */
  archived?: boolean
  createdAt: Timestamp
}

export type CookKind = 'cook' | 'leftovers'

/** cooks/{cookId} */
export type Cook = {
  id: string
  mealId: string
  /** 'YYYY-MM-DD' */
  date: string
  kind: CookKind
  /** Position within that day, 0-based. Reindexed integers, not fractional ranks. */
  order: number
  /** Leftovers only: the cook it came from. Exists only for display. */
  fromCookId?: string
  createdAt: Timestamp
}

/** weeks/{saturdayISO} */
export type Week = {
  id: string
  /** 'YYYY-MM-DD'; defaults to that week's Saturday. */
  shopDate: string
}

/** Derived per-meal statistics. Computed on the frontend, never denormalized. See PLAN.md §4. */
export type MealStats = {
  /** The greatest cook date on or before today, counting both 'cook' and 'leftovers'. */
  lastEaten: string | null
  /** Calendar days from lastEaten to today; null if never eaten. */
  daysSince: number | null
  /** Count of kind: 'cook' documents. */
  timesCooked: number
  /** The smallest cook date after today, if any. */
  nextPlanned: string | null
}
