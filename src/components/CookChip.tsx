import { useDraggable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { useRef, useState } from 'react'
import { fromISODate, nextISODate } from '../lib/dates'
import { cookDragId, leftoversDragId } from '../lib/dnd'
import { useIsMobile } from '../lib/responsive'
import type { Cook, Meal } from '../types'
import DayStrip from './DayStrip'
import Icon from './Icon'
import MealTile from './MealTile'
import Popover from './Popover'

type CookChipProps = {
  cook: Cook
  meal: Meal
  /** Whether the chip sits on today's tinted row, where it takes the pane's own ground. */
  onTodayRow: boolean
  /** The phone card's second line: how long since the meal was last cooked, or where leftovers came from. */
  detail: string
  canMoveLeft: boolean
  canMoveRight: boolean
  weekDays: Date[]
  onDelete: () => void
  onReorder: (direction: 'left' | 'right') => void
  onMoveToDay: (date: string) => void
  onAddLeftovers: (date: string) => void
  onQuickLeftovers: () => void
}

const MENU_LABEL = 'mb-2 ml-0.5 text-xs text-ink-3'
const MENU_ROW =
  'flex w-full items-center gap-3 px-0.5 py-3 text-left text-[15px] md:py-2.5 md:text-sm'
const REORDER_BUTTON =
  'flex h-8 items-center gap-0.5 rounded-full bg-surface-1 pr-3 pl-2 text-xs text-ink-2 hover:text-ink disabled:opacity-40'

/**
 * One cook or leftovers: from `md` up a compact chip of the meal's tile and
 * name; on a phone a full-width card that adds servings and a detail line.
 * Leftovers styling is derived from `kind`, never chosen: an outline instead
 * of a fill, a dimmed tile, and a return-arrow — before the name on a chip,
 * as the tile's badge on a card. See PLAN.md §5.
 *
 * Draggable as a sortable (reorder within a day, or move to another day).
 * On a cook (not leftovers), the return-arrow tab is its own drag source for
 * the leftovers gesture;
 * clicking it adds leftovers to the next day, the answer nearly every time.
 * Clicking the chip opens its menu — any other day, reordering, and removal —
 * as strips of day buttons rather than a list to read through, so nothing
 * here needs a drag. See PLAN.md §6.
 */
export default function CookChip({
  cook,
  meal,
  onTodayRow,
  detail,
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
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)
  // The whole chip opens the menu, so the popover has to count the chip as
  // inside itself or the press that opens the menu reads as the outside click
  // that closes it.
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
  } = useSortable({
    id: cookDragId(cook.id),
    data: { type: 'cook', cook, meal },
  })
  // isOver is only a useful "drop here" signal when it's some other item
  // hovering this chip's slot, not this chip hovering its own.
  const isDropTarget =
    isOver && !isDragging && active?.id !== cookDragId(cook.id)
  const {
    attributes: leftoversAttributes,
    listeners: leftoversListeners,
    setNodeRef: setLeftoversNodeRef,
  } = useDraggable({
    id: leftoversDragId(cook.id),
    data: { type: 'leftovers', cook, meal },
  })

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

  const dayName = format(fromISODate(cook.date), 'EEEE')

  return (
    <div
      ref={node => {
        setChipNodeRef(node)
        chipRef.current = node
      }}
      style={style}
      // `useSortable` puts a transform on this element, which makes it a
      // stacking context — so the open menu's own z-index cannot lift it
      // above anything outside the chip. The chip itself has to be
      // positioned and raised, or later siblings (the add buttons, the rows
      // below) paint straight through the menu.
      className={`relative flex max-w-full items-center ${
        isMobile
          ? 'w-full gap-1 rounded-2xl p-2'
          : 'h-9 max-w-[20rem] gap-0.5 rounded-[10px] p-1.25'
      } ${menuOpen ? 'z-40' : ''} ${
        isLeftovers
          ? 'bg-transparent shadow-[inset_0_0_0_1px_var(--color-line-strong)]'
          : onTodayRow && !isMobile
            ? 'bg-surface-2'
            : 'bg-surface-1'
      } ${isDragging ? 'opacity-40' : ''} ${isDropTarget ? 'ring-2 ring-accent' : ''}`}
    >
      <button
        type="button"
        {...chipAttributes}
        {...chipListeners}
        onClick={() => setMenuOpen(open => !open)}
        aria-expanded={menuOpen}
        aria-label={`${isLeftovers ? 'Leftovers: ' : ''}${meal.name} — actions`}
        title={`${meal.name} — tap for actions, or drag to another day`}
        // `touch-pan-y`, not `touch-none`: chips fill the planner, and a
        // finger on one has to be able to scroll the week. The drag sensor is
        // hold-to-start, so a swipe scrolls and a hold still drags.
        className={`flex h-full min-w-0 flex-1 cursor-grab touch-pan-y items-center pr-1 text-left active:cursor-grabbing ${
          isMobile ? 'gap-3' : 'gap-1.75'
        }`}
      >
        {isMobile ? (
          <>
            <MealTile
              category={meal.category}
              size="card"
              surface={isLeftovers ? 'surface-2' : 'surface-1'}
              leftovers={isLeftovers}
              className={isLeftovers ? 'opacity-70' : ''}
            />
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-[15px] font-medium ${isLeftovers ? 'text-ink-2' : 'text-ink'}`}
              >
                {meal.name}
              </span>
              <span
                className={`mt-0.5 block truncate text-[13px] ${isLeftovers ? 'text-ink-3' : 'text-ink-2'}`}
              >
                {isLeftovers ? detail : `Serves ${meal.servings} · ${detail}`}
              </span>
            </span>
          </>
        ) : (
          <>
            <MealTile
              category={meal.category}
              size="chip"
              className={isLeftovers ? 'opacity-70' : ''}
            />
            <span
              className={`flex min-w-0 items-center gap-1 text-[13px] ${isLeftovers ? 'text-ink-2' : 'text-ink'}`}
            >
              {isLeftovers && (
                <Icon
                  name="leftovers"
                  className="h-3.5 w-3.5"
                  strokeWidth={2}
                />
              )}
              <span className="truncate">{meal.name}</span>
            </span>
          </>
        )}
      </button>

      {!isLeftovers && (
        <button
          ref={setLeftoversNodeRef}
          {...leftoversListeners}
          {...leftoversAttributes}
          type="button"
          onClick={onQuickLeftovers}
          aria-label={`Add ${meal.name} leftovers to the next day`}
          title="Leftovers: click for the next day, or drag to any day"
          className={`flex shrink-0 touch-none items-center justify-center text-ink-3 transition-colors hover:bg-line hover:text-ink ${
            isMobile ? 'h-9 w-9 rounded-[11px]' : 'h-6.5 w-6.5 rounded-md'
          }`}
        >
          <Icon
            name="leftovers"
            className={isMobile ? 'h-5 w-5' : 'h-4 w-4'}
            strokeWidth={isMobile ? 1.8 : 2}
          />
        </button>
      )}

      <Popover
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        // Spans the chip, so the anchored panel opens beneath the chip's own
        // left edge. It must not take the chip's clicks.
        className="pointer-events-none absolute inset-0"
        panelClassName="pointer-events-auto w-[19rem]"
        anchorRef={chipRef}
        sheetTitle={isLeftovers ? `${meal.name} leftovers` : meal.name}
        sheetSubtitle={format(fromISODate(cook.date), 'EEEE d MMMM')}
        sheetLead={
          <MealTile
            category={meal.category}
            size="header"
            surface="surface-3"
            leftovers={isLeftovers}
            className={isLeftovers ? 'opacity-70' : ''}
          />
        }
      >
        <p className={MENU_LABEL}>Move to</p>
        <DayStrip
          days={weekDays}
          onPick={pickDay(onMoveToDay)}
          currentDate={cook.date}
        />

        <p className={`${MENU_LABEL} mt-4`}>Add leftovers to</p>
        <DayStrip
          days={weekDays}
          onPick={pickDay(onAddLeftovers)}
          suggestedDate={nextISODate(cook.date)}
          disabledThrough={cook.date}
        />

        <div className="mt-4 border-t border-line">
          {(canMoveLeft || canMoveRight) && (
            <div className={`${MENU_ROW} border-b border-line`}>
              <Icon name="sort" className="h-5 w-5 text-ink-3" />
              <span className="min-w-0 flex-1 truncate">
                Reorder<span className="md:hidden"> within {dayName}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onReorder('left')
                  setMenuOpen(false)
                }}
                disabled={!canMoveLeft}
                className={REORDER_BUTTON}
              >
                <Icon name="chevron-left" className="h-4 w-4" />
                Earlier
              </button>
              <button
                type="button"
                onClick={() => {
                  onReorder('right')
                  setMenuOpen(false)
                }}
                disabled={!canMoveRight}
                className={`${REORDER_BUTTON} pr-2 pl-3`}
              >
                Later
                <Icon name="chevron-right" className="h-4 w-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              onDelete()
              setMenuOpen(false)
            }}
            className={`${MENU_ROW} pb-0 text-danger md:pb-0`}
          >
            <Icon name="trash" className="h-5 w-5" />
            Remove
          </button>
        </div>
      </Popover>
    </div>
  )
}
