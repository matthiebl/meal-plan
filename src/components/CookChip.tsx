import { useDraggable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRef, useState } from 'react'
import { cookDragId, leftoversDragId } from '../lib/dnd'
import { LEFTOVERS_PREFIX, chipClasses } from '../lib/visuals'
import type { Cook, Meal } from '../types'
import DayStrip from './DayStrip'
import Popover from './Popover'

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
  onQuickLeftovers: () => void
}

const GHOST_BUTTON =
  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-current opacity-75 transition hover:bg-current/20 hover:opacity-100 md:h-7 md:w-7'

const MENU_LABEL = 'mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500'

/**
 * One cook or leftovers chip, styled identically wherever the meal appears.
 * Leftovers styling is derived from `kind`, never chosen: a dashed left
 * edge, a ↩ prefix, and reduced opacity. See PLAN.md §5.
 *
 * Draggable as a sortable (reorder within a day, or move to another day).
 * The ↺ tab is its own drag source for the leftovers gesture; clicking it
 * adds leftovers to the next day, the answer nearly every time. The ⋯ menu
 * holds the rest — any other day, reordering, and removal — as a strip of
 * day buttons rather than a list to read through, and clicking the chip
 * itself opens it, so nothing here needs a drag. See PLAN.md §6.
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
  onQuickLeftovers,
}: CookChipProps) {
  const isLeftovers = cook.kind === 'leftovers'
  const [menuOpen, setMenuOpen] = useState(false)
  // The menu's trigger is the ⋯ button, but the whole chip opens it, so the
  // popover has to count the chip as inside itself or the press that opens
  // the menu reads as the outside click that closes it.
  const chipRef = useRef<HTMLDivElement>(null)

  const {
    attributes: chipAttributes,
    listeners: chipListeners,
    setNodeRef: setChipNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
  } = useSortable({ id: cookDragId(cook.id), data: { type: 'cook', cook, meal } })
  // isOver is only a useful "drop here" signal when it's some other item
  // hovering this chip's slot, not this chip hovering its own.
  const isDropTarget = isOver && !isDragging && active?.id !== cookDragId(cook.id)
  const {
    attributes: leftoversAttributes,
    listeners: leftoversListeners,
    setNodeRef: setLeftoversNodeRef,
  } = useDraggable({ id: leftoversDragId(cook.id), data: { type: 'leftovers', cook, meal } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function pickDay(onPick: (iso: string) => void) {
    return (iso: string) => {
      onPick(iso)
      setMenuOpen(false)
    }
  }

  return (
    <div
      ref={(node) => {
        setChipNodeRef(node)
        chipRef.current = node
      }}
      style={style}
      // `useSortable` puts a transform on this element, which makes it a
      // stacking context — so the open menu's own z-index cannot lift it
      // above anything outside the chip. The chip itself has to be
      // positioned and raised, or later siblings (the add buttons, the rows
      // below) paint straight through the menu.
      className={`relative flex h-11 max-w-full items-center gap-1 py-1 pr-1 pl-3 text-sm font-medium md:h-10 md:max-w-[20rem] md:pl-2.5 ${
        menuOpen ? 'z-40' : ''
      } ${chipClasses(meal.visual)} ${
        isLeftovers
          ? 'rounded-r-full rounded-l-md border-l-[3px] border-current opacity-80 [border-left-style:dashed]'
          : 'rounded-full'
      } ${isDragging ? 'opacity-40' : ''} ${
        isDropTarget ? 'ring-2 ring-sky-500 ring-offset-1 dark:ring-offset-gray-900' : ''
      }`}
    >
      <button
        type="button"
        {...chipAttributes}
        {...chipListeners}
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        title={`${meal.name} — tap for actions, or drag to another day`}
        // `touch-pan-y`, not `touch-none`: chips fill the planner, and a
        // finger on one has to be able to scroll the week. The drag sensor is
        // hold-to-start, so a swipe scrolls and a hold still drags.
        className="flex h-full min-w-0 flex-1 cursor-grab touch-pan-y items-center gap-1.5 text-left active:cursor-grabbing"
      >
        {isLeftovers && <span className="flex-shrink-0 leading-none opacity-80">{LEFTOVERS_PREFIX}</span>}
        {meal.visual.icon && <span className="flex-shrink-0 text-base leading-none">{meal.visual.icon}</span>}
        <span className="truncate">{meal.name}</span>
      </button>

      <button
        ref={setLeftoversNodeRef}
        {...leftoversListeners}
        {...leftoversAttributes}
        type="button"
        onClick={onQuickLeftovers}
        aria-label={`Add ${meal.name} leftovers to the next day`}
        title="Leftovers: click for the next day, or drag to any day"
        className={`${GHOST_BUTTON} touch-none text-base`}
      >
        ↺
      </button>

      <Popover
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        panelClassName="w-[19rem]"
        anchorRef={chipRef}
        sheetTitle={meal.name}
        trigger={
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={`More actions for ${meal.name}`}
            aria-expanded={menuOpen}
            className={`${GHOST_BUTTON} text-base leading-none`}
          >
            ⋯
          </button>
        }
      >
        <p className={MENU_LABEL}>Move to</p>
        <DayStrip days={weekDays} onPick={pickDay(onMoveToDay)} currentDate={cook.date} />

        <p className={`${MENU_LABEL} mt-3`}>Add leftovers to</p>
        <DayStrip days={weekDays} onPick={pickDay(onAddLeftovers)} />

        <div className="mt-3 flex items-center gap-1 border-t border-gray-200 pt-3 dark:border-gray-800">
          <button
            type="button"
            onClick={() => {
              onReorder('left')
              setMenuOpen(false)
            }}
            disabled={!canMoveLeft}
            className="rounded-lg px-2.5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
          >
            ‹ Earlier
          </button>
          <button
            type="button"
            onClick={() => {
              onReorder('right')
              setMenuOpen(false)
            }}
            disabled={!canMoveRight}
            className="rounded-lg px-2.5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Later ›
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete()
              setMenuOpen(false)
            }}
            className="ml-auto rounded-lg px-2.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Remove
          </button>
        </div>
      </Popover>
    </div>
  )
}
