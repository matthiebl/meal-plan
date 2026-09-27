import type { Aisle, Ingredient } from '../types'

/**
 * Every aisle in the order a supermarket is walked, which is the order the
 * shopping list takes. See PLAN.md §3.
 */
export const AISLES: { id: Aisle; label: string }[] = [
  { id: 'produce', label: 'Produce' },
  { id: 'meat', label: 'Meat & fish' },
  { id: 'dairy', label: 'Dairy & eggs' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'household', label: 'Household' },
  { id: 'other', label: 'Other' },
]

export const AISLE_LABELS = Object.fromEntries(
  AISLES.map(aisle => [aisle.id, aisle.label]),
) as Record<Aisle, string>

/** An absent aisle reads as 'other', so an ingredient never falls off the list. */
export function aisleOf(ingredient: Ingredient): Aisle {
  return ingredient.aisle ?? 'other'
}

/** The case-insensitive substring match search uses throughout the app. */
export function matchesName(name: string, search: string): boolean {
  const query = search.trim().toLowerCase()
  return query === '' || name.toLowerCase().includes(query)
}

/** The ingredients a search matches, alphabetical; all of them for an empty search. */
export function searchIngredients(
  ingredients: Ingredient[],
  search: string,
): Ingredient[] {
  return ingredients
    .filter(ingredient => matchesName(ingredient.name, search))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * True when the search names an existing ingredient exactly. The picker
 * offers `Create "…"` only when it does not, so 'Onion' is not created twice.
 */
export function hasExactName(
  ingredients: Ingredient[],
  search: string,
): boolean {
  const query = search.trim().toLowerCase()
  return ingredients.some(ingredient => ingredient.name.toLowerCase() === query)
}
