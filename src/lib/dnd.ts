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

export type DropData = { type: 'day'; date: string } | { type: 'cook'; cook: Cook }
