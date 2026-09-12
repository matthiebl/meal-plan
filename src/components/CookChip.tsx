import { useDraggable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { toISODate } from '../lib/dates'
import { cookDragId, leftoversDragId } from '../lib/dnd'
import { chipClasses } from '../lib/visuals'
import type { Cook, Meal } from '../types'

type CookChipProps = {
  cook: Cook
  meal: Meal
  canMoveLeft: boolean
  canMoveRight: boolean
  weekDays: Date[]
  onDelete: () => void
  onReorder: (direction: 'left' | 'right') => void
  onMoveToDay: (date: string) => void
  onAddLeftovers: (date: string) => void
}

/**
 * One cook or leftovers chip, styled identically wherever the meal appears.
 * Leftovers styling is derived from `kind`, never chosen: a dashed left
 * edge, a ↩ prefix, and reduced opacity. See PLAN.md §5.
 *
 * Draggable as a sortable (reorder within a day, or move to another day).
 * The small ↺ tab is its own drag source for the leftovers gesture, and
 * doubles as its click equivalent. The ⋯ menu is the click/keyboard
 * equivalent for reordering and moving. See PLAN.md §6.
 */
export default function CookChip({
  cook,
  meal,
  canMoveLeft,
  canMoveRight,
  weekDays,
  onDelete,
  onReorder,
  onMoveToDay,
  onAddLeftovers,
}: CookChipProps) {
  const isLeftovers = cook.kind === 'leftovers'
  const [menu, setMenu] = useState<'move' | 'leftovers' | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const {
    attributes: chipAttributes,
    listeners: chipListeners,
    setNodeRef: setChipNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cookDragId(cook.id), data: { type: 'cook', cook, meal } })
  const {
    attributes: leftoversAttributes,
    listeners: leftoversListeners,
    setNodeRef: setLeftoversNodeRef,
  } = useDraggable({ id: leftoversDragId(cook.id), data: { type: 'leftovers', cook, meal } })

  useEffect(() => {
    if (!menu) return
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenu(null)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menu])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const otherDays = weekDays.filter((d) => toISODate(d) !== cook.date)

  return (
    <div
      ref={(node) => {
        setChipNodeRef(node)
        containerRef.current = node
      }}
      style={style}
      className={`relative flex items-center gap-1 py-1 pr-1 pl-1.5 text-xs font-medium ${chipClasses(meal.visual)} ${
        isLeftovers
          ? 'rounded-r-full border-l-2 border-current opacity-75 [border-left-style:dashed]'
          : 'rounded-full'
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <button
        ref={setLeftoversNodeRef}
        {...leftoversListeners}
        {...leftoversAttributes}
        type="button"
        onClick={() => setMenu((m) => (m === 'leftovers' ? null : 'leftovers'))}
        aria-label={`Add ${meal.name} as leftovers on another day`}
        title="Drag, or click, to add as leftovers on another day"
        className="flex h-5 w-4 flex-shrink-0 touch-none items-center justify-center rounded-full text-[10px] leading-none opacity-70 hover:opacity-100"
      >
        ↺
      </button>

      <span
        {...chipAttributes}
        {...chipListeners}
        className="min-w-0 flex-1 cursor-grab truncate touch-none"
      >
        {isLeftovers ? '↩ ' : ''}
        {meal.visual.icon ? `${meal.visual.icon} ` : ''}
        {meal.name}
      </span>

      <button
        type="button"
        onClick={() => setMenu((m) => (m === 'move' ? null : 'move'))}
        aria-label={`Move ${meal.name}`}
        className="flex-shrink-0 rounded-full px-1 text-current opacity-60 hover:opacity-100"
      >
        ⋯
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Remove ${meal.name} from this day`}
        className="flex-shrink-0 rounded-full px-1 text-current opacity-60 hover:opacity-100"
      >
        ×
      </button>

      {menu === 'move' && (
        <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white p-1 text-gray-900 shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
          <button
            type="button"
            onClick={() => {
              onReorder('left')
              setMenu(null)
            }}
            disabled={!canMoveLeft}
            className="block w-full rounded-md px-2 py-1 text-left text-xs hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-800"
          >
            ‹ Move earlier
          </button>
          <button
            type="button"
            onClick={() => {
              onReorder('right')
              setMenu(null)
            }}
            disabled={!canMoveRight}
            className="block w-full rounded-md px-2 py-1 text-left text-xs hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-800"
          >
            Move later ›
          </button>
          <div className="my-1 border-t border-gray-200 dark:border-gray-800" />
          <p className="px-2 pb-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-600">
            Move to day
          </p>
          {otherDays.map((d) => (
            <button
              key={toISODate(d)}
              type="button"
              onClick={() => {
                onMoveToDay(toISODate(d))
                setMenu(null)
              }}
              className="block w-full rounded-md px-2 py-1 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {format(d, 'EEE d')}
            </button>
          ))}
        </div>
      )}

      {menu === 'leftovers' && (
        <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white p-1 text-gray-900 shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
          <p className="px-2 pb-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-600">
            Add leftovers to
          </p>
          {weekDays.map((d) => (
            <button
              key={toISODate(d)}
              type="button"
              onClick={() => {
                onAddLeftovers(toISODate(d))
                setMenu(null)
              }}
              className="block w-full rounded-md px-2 py-1 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {format(d, 'EEE d')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
