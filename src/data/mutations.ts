import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { MealVisual } from '../types'

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
