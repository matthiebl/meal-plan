import { useDraggable } from '@dnd-kit/core'
import { useState } from 'react'
import { formatISODay } from '../lib/dates'
import { mealDragId } from '../lib/dnd'
import { chipClasses } from '../lib/visuals'
import type { Meal, MealStats } from '../types'
import DayStrip from './DayStrip'
import Popover from './Popover'

type MealCardProps = {
  meal: Meal
  stats: MealStats
  /** The eight days the planner is showing, so the card can plan onto one. */
  weekDays: Date[]
  onPlan: (date: string) => void
  onEdit: () => void
}

/** How long ago a meal was last eaten, as the card's headline figure. */
function sinceLabel(daysSince: number): { value: string; caption: string } {
  if (daysSince === 0) return { value: 'Today', caption: 'last eaten' }
  if (daysSince === 1) return { value: '1', caption: 'day ago' }
  return { value: String(daysSince), caption: 'days ago' }
}

/**
 * One meal in the library: its visual, servings, and the §4 derived
 * statistics. Days since is the headline figure, because it is what the
 * default sort orders by and the question the library exists to answer.
 *
 * Draggable onto a day to create a cook there. Clicking it opens the same
 * thing as a week strip to point at — the only path to planning from here on
 * a phone, where the two panes are never on screen together. See PLAN.md §6.
 */
export default function MealCard({ meal, stats, weekDays, onPlan, onEdit }: MealCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: mealDragId(meal.id),
    data: { type: 'meal', meal },
  })

  const since = stats.daysSince === null ? null : sinceLabel(stats.daysSince)

  return (
    <Popover
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      panelClassName="w-[19rem]"
      sheetTitle={meal.name}
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
          className={`w-full cursor-grab touch-pan-y rounded-xl border border-gray-200 bg-white p-2.5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 active:cursor-grabbing md:p-3 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-800/60 ${
            isDragging ? 'opacity-40' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span
                className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${chipClasses(
                  meal.visual,
                )}`}
              >
                {meal.visual.icon && <span className="flex-shrink-0 text-base leading-none">{meal.visual.icon}</span>}
                <span className="truncate">{meal.name}</span>
              </span>

              <dl className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <div>
                  <dt className="sr-only">Servings</dt>
                  <dd>{meal.servings} servings</dd>
                </div>
                <span aria-hidden className="text-gray-300 dark:text-gray-700">
                  ·
                </span>
                <div>
                  <dt className="sr-only">Times cooked</dt>
                  <dd>
                    cooked {stats.timesCooked}
                    {'×'}
                  </dd>
                </div>
                {stats.lastEaten && (
                  <>
                    <span aria-hidden className="text-gray-300 dark:text-gray-700">
                      ·
                    </span>
                    <div>
                      <dt className="sr-only">Last eaten</dt>
                      <dd>last {formatISODay(stats.lastEaten)}</dd>
                    </div>
                  </>
                )}
              </dl>

              {stats.nextPlanned && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  Planned {formatISODay(stats.nextPlanned)}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 text-right">
              {since ? (
                <>
                  <div className="text-2xl font-semibold leading-none tabular-nums text-gray-800 dark:text-gray-100">
                    {since.value}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{since.caption}</div>
                </>
              ) : (
                <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                  never
                </span>
              )}
            </div>
          </div>
        </button>
      }
    >
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        Plan on
      </p>
      <DayStrip
        days={weekDays}
        onPick={(iso) => {
          onPlan(iso)
          setMenuOpen(false)
        }}
      />

      <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false)
            onEdit()
          }}
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Edit meal
        </button>
      </div>
    </Popover>
  )
}
