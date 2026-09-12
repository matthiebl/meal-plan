import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { CookKind, MealVisual } from '../types'

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

/** Creates a cook (or leftovers) at a given position within its day. */
export function addCook(input: CookInput) {
  return addDoc(collection(db, 'cooks'), {
    ...input,
    createdAt: serverTimestamp(),
  })
}

/** Deletes a cook. Leftovers referencing it via `fromCookId` survive, per PLAN.md §3. */
export function deleteCook(cookId: string) {
  return deleteDoc(doc(db, 'cooks', cookId))
}
