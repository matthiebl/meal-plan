import { format } from 'date-fns'
import { formatWeekRange, formatWeekRelative } from '../lib/dates'
import { usePlannerRoute } from '../lib/plannerRoute'
import Icon from './Icon'

const NAV_BUTTON =
  'flex h-8 w-8 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-1 hover:text-ink'

/** Previous and next, for whichever of week or month is showing. */
function StepButtons() {
  const { isWeek, goPrevious, goNext } = usePlannerRoute()
  return (
    <>
      <button type="button" onClick={goPrevious} aria-label={isWeek ? 'Previous week' : 'Previous month'} className={NAV_BUTTON}>
        <Icon name="chevron-left" />
      </button>
      <button type="button" onClick={goNext} aria-label={isWeek ? 'Next week' : 'Next month'} className={NAV_BUTTON}>
        <Icon name="chevron-right" />
      </button>
    </>
  )
}

/** The week/month switch, as a segmented control. */
function ViewSwitch() {
  const { isWeek, showWeek, showMonth } = usePlannerRoute()
  const segment = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-xs transition-colors ${
      active ? 'bg-surface-2 text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
    }`
  return (
    <div className="flex flex-shrink-0 rounded-full bg-surface-1 p-0.75">
      <button type="button" onClick={showWeek} aria-pressed={isWeek} className={segment(isWeek)}>
        Week
      </button>
      <button type="button" onClick={showMonth} aria-pressed={!isWeek} className={segment(!isWeek)}>
        Month
      </button>
    </div>
  )
}

/**
 * Everything that moves the planner — previous, next, today, and the
 * week/month switch — in one row, centred in the desktop app header. See
 * PLAN.md §6.
 */
export function PlannerToolbar() {
  const { isWeek, anchor, saturday, showingToday, goToday } = usePlannerRoute()
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        <StepButtons />
      </div>
      <h2 className="min-w-40 text-center text-[13px]">
        {isWeek ? formatWeekRange(saturday) : format(anchor, 'MMMM yyyy')}
      </h2>
      <button
        type="button"
        onClick={goToday}
        disabled={showingToday}
        title={showingToday ? `Already showing this ${isWeek ? 'week' : 'month'}` : undefined}
        className="mr-1 rounded-full bg-surface-1 px-2.5 py-1.25 text-xs text-ink-2 transition-colors hover:text-ink disabled:opacity-50 disabled:hover:text-ink-2"
      >
        Today
      </button>
      <ViewSwitch />
    </div>
  )
}

/**
 * The same controls as a phone's planner header. A week near now is titled by
 * where it sits (`This week`) with its dates beneath; any other week is titled
 * by its dates, with the year beneath. Today is offered in the subtitle, only
 * when the planner has moved away from it.
 */
export function PlannerMobileHeader() {
  const { isWeek, anchor, saturday, showingToday, goToday } = usePlannerRoute()
  const relative = formatWeekRelative(saturday)
  const isNear = relative.endsWith('week')
  const title = isWeek ? (isNear ? relative : formatWeekRange(saturday, 'MMM')) : format(anchor, 'MMMM')
  const subtitle = isWeek ? (isNear ? formatWeekRange(saturday) : format(saturday, 'yyyy')) : format(anchor, 'yyyy')

  return (
    <header className="flex flex-shrink-0 items-center gap-2 px-4 pt-4 pb-1">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xl font-medium">{title}</h2>
        <p className="mt-0.5 flex min-w-0 items-center gap-2 text-[13px] text-ink-3">
          <span className="truncate">{subtitle}</span>
          {!showingToday && (
            <button type="button" onClick={goToday} className="flex-shrink-0 text-accent">
              Today
            </button>
          )}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center">
        <StepButtons />
      </div>
      <ViewSwitch />
    </header>
  )
}
