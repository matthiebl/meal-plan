import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from '@dnd-kit/core'
import type { Cook, Meal } from '../types'

// dnd-kit ids are shared across one DndContext spanning both panes, so every
// draggable/droppable id is namespaced by kind to stay unique.
export const mealDragId = (mealId: string) => `meal:${mealId}`
export const cookDragId = (cookId: string) => `cook:${cookId}`
export const leftoversDragId = (cookId: string) => `leftovers:${cookId}`
export const dayDropId = (date: string) => `day:${date}`

export type DragData =
  | { type: 'meal'; meal: Meal }
  | { type: 'cook'; cook: Cook; meal: Meal }
  | { type: 'leftovers'; cook: Cook; meal: Meal }

export type DropData =
  | { type: 'day'; date: string }
  | { type: 'cook'; cook: Cook }

/**
 * `closestCenter` compares distance to each droppable's *rect center*,
 * which is unreliable here: a day row spans the full pane width but is
 * only one chip tall, so its center can sit far from the cursor even while
 * the cursor is squarely inside the row. Checking which rect the pointer
 * is literally within resolves the correct day (and, when the pointer is
 * over a specific chip, the correct drop index) — falling back to
 * closestCenter only for the rare frame where the pointer has momentarily
 * left every droppable (e.g. a fast drag between rows).
 */
export const collisionDetection: CollisionDetection = args => {
  const pointerHits = pointerWithin(args)
  if (pointerHits.length === 0) return closestCenter(args)

  // The day container's rect always encloses its chips, so both can be hit
  // at once; prefer the chip so drops land at a precise index.
  const chipHit = pointerHits.find(hit => {
    const data = hit.data?.droppableContainer.data.current as
      | DropData
      | undefined
    return data?.type === 'cook'
  })
  return chipHit ? [chipHit] : pointerHits
}
