import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type {
  Aisle,
  Cook,
  CookKind,
  MealCategory,
  RecipeItem,
  Unit,
} from '../types'

/**
 * Firestore applies a local write to `onSnapshot` immediately, so nothing in
 * the UI waits on the returned promise: it settles only once the server
 * acknowledges the write, which offline never happens. Awaiting one would
 * leave a dialog open or a button spinning long after the change is on
 * screen. Failures are logged rather than thrown. See PLAN.md §6.
 */
function fire(write: Promise<unknown>): void {
  write.catch((error: unknown) =>
    console.error('Firestore write failed', error),
  )
}

export type MealInput = {
  name: string
  servings: number
  category: MealCategory | undefined
}

/** Firestore rejects `undefined` field values, so an unset secondary is left out entirely. */
function categoryData(category: MealCategory): MealCategory {
  return category.secondary
    ? { main: category.main, secondary: category.secondary }
    : { main: category.main }
}

/** Creates a new meal, returning its id immediately. */
export function addMeal({ name, servings, category }: MealInput): string {
  const ref = doc(collection(db, 'meals'))
  fire(
    setDoc(ref, {
      name,
      servings,
      ...(category ? { category: categoryData(category) } : {}),
      createdAt: serverTimestamp(),
    }),
  )
  return ref.id
}

/**
 * Saves a meal's editable fields. A cleared category is deleted rather than
 * left behind, and so is `visual`, the retired colour/fill/emoji field that
 * meals created before categories still carry.
 */
export function updateMeal(
  mealId: string,
  { name, servings, category }: MealInput,
): void {
  fire(
    updateDoc(doc(db, 'meals', mealId), {
      name,
      servings,
      category: category ? categoryData(category) : deleteField(),
      visual: deleteField(),
    }),
  )
}

/** Soft-deletes a meal. It is hidden from the meal list but still renders in the planner. */
export function archiveMeal(mealId: string): void {
  fire(updateDoc(doc(db, 'meals', mealId), { archived: true }))
}

export type CookInput = {
  mealId: string
  date: string
  kind: CookKind
  order: number
  fromCookId?: string
}

/** Creates a cook (or leftovers) at the end of its day. No reindex needed. */
export function addCook(input: CookInput): string {
  const ref = doc(collection(db, 'cooks'))
  fire(setDoc(ref, { ...input, createdAt: serverTimestamp() }))
  return ref.id
}

export type LeftoversInput = {
  mealId: string
  date: string
  order: number
  fromCookId: string
}

/** Creates a leftovers cook at the end of its day, returning its id so it can be undone. */
export function addLeftovers(input: LeftoversInput): string {
  const ref = doc(collection(db, 'cooks'))
  fire(
    setDoc(ref, {
      ...input,
      kind: 'leftovers' as const,
      createdAt: serverTimestamp(),
    }),
  )
  return ref.id
}

/**
 * Creates a cook at a specific index within a day, reindexing the rest of
 * that day's cooks in the same batch. Used for drops at a precise position;
 * `addCook`/`addLeftovers` cover the simple append case.
 */
export function insertCook(
  input: Omit<CookInput, 'order'>,
  dayIds: string[],
  index: number,
): void {
  const batch = writeBatch(db)
  const newRef = doc(collection(db, 'cooks'))
  batch.set(newRef, { ...input, order: index, createdAt: serverTimestamp() })
  dayIds.forEach((id, i) => {
    batch.update(doc(db, 'cooks', id), { order: i < index ? i : i + 1 })
  })
  fire(batch.commit())
}

/** Rewrites one day's cooks with consecutive order values in a single batch. */
export function reorderDay(orderedCookIds: string[]): void {
  const batch = writeBatch(db)
  orderedCookIds.forEach((id, index) =>
    batch.update(doc(db, 'cooks', id), { order: index }),
  )
  fire(batch.commit())
}

/**
 * Moves a cook to a different day at a given position, reindexing both the
 * origin and destination days in one batch. `originDayIds` and `destDayIds`
 * must not overlap: they are two different days' cook ids, excluding and
 * including `cookId` respectively.
 */
export function moveCook(
  cookId: string,
  date: string,
  originDayIds: string[],
  destDayIds: string[],
): void {
  const batch = writeBatch(db)
  originDayIds.forEach((id, index) =>
    batch.update(doc(db, 'cooks', id), { order: index }),
  )
  destDayIds.forEach((id, index) => {
    batch.update(
      doc(db, 'cooks', id),
      id === cookId ? { order: index, date } : { order: index },
    )
  })
  fire(batch.commit())
}

/** Deletes a cook. Leftovers referencing it via `fromCookId` survive, per PLAN.md §3. */
export function deleteCook(cookId: string): void {
  fire(deleteDoc(doc(db, 'cooks', cookId)))
}

/** Restores a just-deleted cook with its original id and fields — the undo for `deleteCook`. */
export function restoreCook(cook: Cook): void {
  const { id, ...data } = cook
  fire(setDoc(doc(db, 'cooks', id), data))
}

/** Sets a week's shop day — its own Saturday, or the Sunday right after. */
export function setShopDate(saturdayISO: string, shopDate: string): void {
  fire(setDoc(doc(db, 'weeks', saturdayISO), { shopDate }))
}

export type NewIngredient = {
  name: string
  aisle: Aisle | undefined
  defaultUnit: Unit | undefined
}

/**
 * Creates an ingredient, returning its id immediately so the recipe row that
 * asked for it can be written in the same gesture. Firestore rejects
 * `undefined`, so an unset aisle or unit is left out entirely.
 */
export function addIngredient({
  name,
  aisle,
  defaultUnit,
}: NewIngredient): string {
  const ref = doc(collection(db, 'ingredients'))
  fire(
    setDoc(ref, {
      name,
      ...(aisle ? { aisle } : {}),
      ...(defaultUnit ? { defaultUnit } : {}),
      createdAt: serverTimestamp(),
    }),
  )
  return ref.id
}

export type IngredientPatch = {
  name?: string
  /** `null` clears a stored aisle, which then reads as 'other'. */
  aisle?: Aisle | null
  /** `null` clears a stored default unit. */
  defaultUnit?: Unit | null
}

/**
 * Saves whichever of an ingredient's fields are named. A partial patch rather
 * than a whole-document save, because two call sites are independent: the
 * picker renames an ingredient or moves its aisle, and saving a recipe row
 * records the unit it used as the ingredient's `defaultUnit` so the second
 * time it is added nothing needs tapping. See PLAN.md §6.
 */
export function updateIngredient(
  ingredientId: string,
  patch: IngredientPatch,
): void {
  const data: Record<string, unknown> = {}
  if (patch.name !== undefined) data.name = patch.name
  if (patch.aisle !== undefined) data.aisle = patch.aisle ?? deleteField()
  if (patch.defaultUnit !== undefined) {
    data.defaultUnit = patch.defaultUnit ?? deleteField()
  }
  fire(updateDoc(doc(db, 'ingredients', ingredientId), data))
}

/** Firestore rejects `undefined`, so a row with no note is written without the key. */
function recipeItemData({ ingredientId, amount, unit, note }: RecipeItem): RecipeItem {
  return { ingredientId, amount, unit, ...(note ? { note } : {}) }
}

/**
 * Replaces a meal's recipe items — every addition, edit, reorder and removal
 * on the recipe sheet, which has no Save button. Merged, so the document is
 * created by its first ingredient and so a future `method` field survives an
 * ingredient edit. A recipe emptied of items keeps an empty `items` rather
 * than being deleted. See PLAN.md §6 and §10.
 */
export function setRecipeItems(mealId: string, items: RecipeItem[]): void {
  fire(
    setDoc(
      doc(db, 'recipes', mealId),
      { items: items.map(recipeItemData), updatedAt: serverTimestamp() },
      { merge: true },
    ),
  )
}
