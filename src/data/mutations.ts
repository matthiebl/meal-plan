import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Cook, CookKind, MealVisual } from '../types'

export type MealInput = {
  name: string
  servings: number
  visual: MealVisual
}

/** Creates a new meal. */
export function addMeal(input: MealInput) {
  return addDoc(collection(db, 'meals'), {
    ...input,
    createdAt: serverTimestamp(),
  })
}

/** Updates a meal's editable fields. */
export function updateMeal(mealId: string, edits: Partial<MealInput>) {
  return updateDoc(doc(db, 'meals', mealId), edits)
}

/** Soft-deletes a meal. It is hidden from the meal list but still renders in the planner. */
export function archiveMeal(mealId: string) {
  return updateDoc(doc(db, 'meals', mealId), { archived: true })
}

export type CookInput = {
  mealId: string
  date: string
  kind: CookKind
  order: number
  fromCookId?: string
}

/** Creates a cook (or leftovers) at the end of its day. No reindex needed. */
export function addCook(input: CookInput) {
  return addDoc(collection(db, 'cooks'), {
    ...input,
    createdAt: serverTimestamp(),
  })
}

export type LeftoversInput = {
  mealId: string
  date: string
  order: number
  fromCookId: string
}

/** Creates a leftovers cook at the end of its day. */
export function addLeftovers(input: LeftoversInput) {
  return addDoc(collection(db, 'cooks'), {
    ...input,
    kind: 'leftovers' as const,
    createdAt: serverTimestamp(),
  })
}

/**
 * Creates a cook at a specific index within a day, reindexing the rest of
 * that day's cooks in the same batch. Used for drops at a precise position;
 * `addCook`/`addLeftovers` cover the simple append case.
 */
export function insertCook(input: Omit<CookInput, 'order'>, dayIds: string[], index: number) {
  const batch = writeBatch(db)
  const newRef = doc(collection(db, 'cooks'))
  batch.set(newRef, { ...input, order: index, createdAt: serverTimestamp() })
  dayIds.forEach((id, i) => {
    batch.update(doc(db, 'cooks', id), { order: i < index ? i : i + 1 })
  })
  return batch.commit()
}

/** Rewrites one day's cooks with consecutive order values in a single batch. */
export function reorderDay(orderedCookIds: string[]) {
  const batch = writeBatch(db)
  orderedCookIds.forEach((id, index) => batch.update(doc(db, 'cooks', id), { order: index }))
  return batch.commit()
}

/**
 * Moves a cook to a different day at a given position, reindexing both the
 * origin and destination days in one batch. `originDayIds` and `destDayIds`
 * must not overlap: they are two different days' cook ids, excluding and
 * including `cookId` respectively.
 */
export function moveCook(cookId: string, date: string, originDayIds: string[], destDayIds: string[]) {
  const batch = writeBatch(db)
  originDayIds.forEach((id, index) => batch.update(doc(db, 'cooks', id), { order: index }))
  destDayIds.forEach((id, index) => {
    batch.update(doc(db, 'cooks', id), id === cookId ? { order: index, date } : { order: index })
  })
  return batch.commit()
}

/** Deletes a cook. Leftovers referencing it via `fromCookId` survive, per PLAN.md §3. */
export function deleteCook(cookId: string) {
  return deleteDoc(doc(db, 'cooks', cookId))
}

/** Restores a just-deleted cook with its original id and fields — the undo for `deleteCook`. */
export function restoreCook(cook: Cook) {
  const { id, ...data } = cook
  return setDoc(doc(db, 'cooks', id), data)
}

/** Sets a week's shop day — its own Saturday, or the Sunday right after. */
export function setShopDate(saturdayISO: string, shopDate: string) {
  return setDoc(doc(db, 'weeks', saturdayISO), { shopDate })
}
