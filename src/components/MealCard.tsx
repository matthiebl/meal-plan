import { useDraggable } from '@dnd-kit/core'
import { useState } from 'react'
import { formatISODay } from '../lib/dates'
import { mealDragId } from '../lib/dnd'
import type { Meal, MealStats } from '../types'
import DayStrip from './DayStrip'
import Icon from './Icon'
import MealSummary, { MEAL_CARD_CLASSES, PLANNED_OUTLINE } from './MealSummary'
import MealTile from './MealTile'
import Popover from './Popover'

type MealCardProps = {
  meal: Meal
  stats: MealStats
  /** The eight days the planner is showing, so the card can plan onto one. */
  weekDays: Date[]
  /** Makes times cooked the headline figure, in place of days since. */
  headlineTimesCooked: boolean
  onPlan: (date: string) => void
  onEdit: () => void
}

/** Times cooked, as a phrase. */
function cookedLabel(timesCooked: number): string {
  return timesCooked === 0 ? 'never cooked' : timesCooked === 1 ? 'cooked once' : `cooked ${timesCooked}×`
}

/**
 * One meal in the library, as a MealSummary whose headline figure follows
 * the list's sort.
 *
 * Draggable onto a day to create a cook there. Clicking it opens the same
 * thing as a week strip to point at — the only path to planning from here on
 * a phone, where the two panes are never on screen together. See PLAN.md §6.
 */
export default function MealCard({ meal, stats, weekDays, headlineTimesCooked, onPlan, onEdit }: MealCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: mealDragId(meal.id),
    data: { type: 'meal', meal },
  })

  return (
    <Popover
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      panelClassName="w-[19rem]"
      sheetTitle={meal.name}
      sheetSubtitle={`${stats.lastEaten ? `Last eaten ${formatISODay(stats.lastEaten)}` : 'Never eaten'} · ${cookedLabel(stats.timesCooked)}`}
      sheetLead={<MealTile category={meal.category} size="header" surface="surface-3" />}
      trigger={
        <button
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          title={`${meal.name} — tap to plan or edit, or drag onto a day`}
          // `touch-pan-y`, not `touch-none`: the card covers most of the list,
          // and a finger on one has to be able to scroll it. The drag sensor
          // is hold-to-start, so a swipe scrolls and a hold still drags.
          className={`${MEAL_CARD_CLASSES} cursor-grab touch-pan-y transition-shadow active:cursor-grabbing ${
            stats.nextPlanned ? PLANNED_OUTLINE : ''
          } ${isDragging ? 'opacity-40' : ''}`}
        >
          <MealSummary meal={meal} stats={stats} headlineTimesCooked={headlineTimesCooked} />
        </button>
      }
    >
      <p className="mb-2 ml-0.5 text-xs text-ink-3">Plan on</p>
      <DayStrip
        days={weekDays}
        onPick={(iso) => {
          onPlan(iso)
          setMenuOpen(false)
        }}
      />

      <div className="mt-4 border-t border-line">
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false)
            onEdit()
          }}
          className="flex w-full items-center gap-3 px-0.5 pt-3 text-left text-[15px] md:text-sm"
        >
          <Icon name="pencil" className="h-5 w-5 text-ink-3" />
          Edit meal
        </button>
      </div>
    </Popover>
  )
}
