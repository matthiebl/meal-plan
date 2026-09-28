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

/**
 * The closed set of units — tapped, never typed. Each belongs to a family;
 * amounts sum within a family and never across one. See PLAN.md §3.
 */
export type Unit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'L'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'each'
  | 'clove'
  | 'bunch'
  | 'sprig'
  | 'can'
  | 'packet'
  | 'slice'
  | 'some'

/** A unit's family: which chip row it is offered in. See lib/units.ts. */
export type UnitFamily = 'mass' | 'volume' | 'kitchen' | 'count' | 'unmeasured'

/** The closed set of aisles, ordered as a supermarket is walked. See lib/ingredients.ts. */
export type Aisle =
  | 'produce'
  | 'meat'
  | 'dairy'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'drinks'
  | 'household'
  | 'other'

/** ingredients/{ingredientId} */
export type Ingredient = {
  id: string
  /** Canonical, as it appears on the shopping list. Renaming renames it everywhere. */
  name: string
  /** Absent reads as 'other'. */
  aisle?: Aisle
  /** Offered first the next time this ingredient is added to a recipe. */
  defaultUnit?: Unit
  createdAt: Timestamp
}

export type RecipeItem = {
  ingredientId: string
  /** > 0, as entered, for the meal's stated servings. Planning a meal does not scale it. */
  amount: number
  unit: Unit
  /** How it is prepared — 'minced'. Renders on the recipe sheet, never on the shopping list. */
  note?: string
}

/** recipes/{mealId} — never a subcollection, so a week's recipes can be fetched together. */
export type Recipe = {
  /** The meal's id: `recipes` is keyed by `mealId`. */
  id: string
  /** In the order entered. */
  items: RecipeItem[]
  updatedAt: Timestamp
}

/**
 * A shopping-list item that is done. `got` went in the trolley; `have` was
 * already in the cupboard. An absent key on the week reads as 'toGet'; kept
 * apart, the two say how often an ingredient must actually be bought against
 * how often it is cooked with. See PLAN.md §3 and §10.
 */
export type ItemState = 'got' | 'have'

/** An ad-hoc shopping-list item, belonging to no meal. */
export type Extra = {
  id: string
  name: string
}

/** weeks/{saturdayISO} */
export type Week = {
  id: string
  /** 'YYYY-MM-DD'; absent reads as that week's own Saturday. */
  shopDate?: string
  /** Ingredient or extra id -> its state on this week's list; an absent key is 'toGet'. */
  shopping?: Record<string, ItemState>
  /** Ad-hoc items, belonging to no meal, in the order added. */
  extras?: Extra[]
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
