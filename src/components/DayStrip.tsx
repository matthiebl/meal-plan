import { format } from 'date-fns'
import { toISODate, todayISODate } from '../lib/dates'

type DayStripProps = {
  days: Date[]
  onPick: (iso: string) => void
  /** The day the thing already sits on: filled, and not pickable. */
  currentDate?: string
  /** The likeliest pick, tinted so it is found first. */
  suggestedDate?: string
  /** Days on or before this one are not pickable. */
  disabledThrough?: string
}

/**
 * The week's eight days as a row of buttons — a small calendar to point at,
 * never a list of day names to read down. Used wherever something is placed
 * on a day without dragging it there. See PLAN.md §6.
 */
export default function DayStrip({ days, onPick, currentDate, suggestedDate, disabledThrough }: DayStripProps) {
  const today = todayISODate()

  return (
    <div className="grid grid-cols-8 gap-1.5">
      {days.map((day) => {
        const iso = toISODate(day)
        const isCurrent = iso === currentDate
        const isDisabled = disabledThrough !== undefined && iso <= disabledThrough
        return (
          <button
            key={iso}
            type="button"
            disabled={isCurrent || isDisabled}
            aria-current={isCurrent || undefined}
            aria-label={format(day, 'EEEE d MMMM')}
            onClick={() => onPick(iso)}
            className={`flex flex-col items-center rounded-[11px] py-1.5 transition-colors ${
              isCurrent
                ? 'bg-primary text-on-primary'
                : iso === suggestedDate
                  ? 'bg-accent-soft text-accent'
                  : `bg-surface-1 hover:bg-line ${iso === today ? 'text-accent' : 'text-ink'}`
            } ${isDisabled ? 'opacity-40' : ''}`}
          >
            <span className={`text-[11px] ${isCurrent || iso === suggestedDate ? 'opacity-75' : 'text-ink-3'}`}>
              {format(day, 'EEEEE')}
            </span>
            <span className={`text-[13px] tabular-nums ${iso === suggestedDate ? 'font-medium' : ''}`}>
              {format(day, 'd')}
            </span>
          </button>
        )
      })}
    </div>
  )
}
