import { format } from 'date-fns'
import { toISODate, todayISODate } from '../lib/dates'

type DayStripProps = {
  days: Date[]
  onPick: (iso: string) => void
  /** The day the thing already sits on: shown as current, and not pickable. */
  currentDate?: string
  /** Days that already carry this meal, marked with a dot. */
  markedDates?: Set<string>
}

/**
 * The week's eight days as a row of buttons — a small calendar to point at,
 * never a list of day names to read down. Used wherever something is placed
 * on a day without dragging it there. See PLAN.md §6.
 */
export default function DayStrip({ days, onPick, currentDate, markedDates }: DayStripProps) {
  const today = todayISODate()

  return (
    <div className="grid grid-cols-8 gap-1">
      {days.map((day) => {
        const iso = toISODate(day)
        const isCurrent = iso === currentDate
        return (
          <button
            key={iso}
            type="button"
            disabled={isCurrent}
            aria-current={isCurrent || undefined}
            aria-label={format(day, 'EEEE d MMMM')}
            onClick={() => onPick(iso)}
            className={`flex flex-col items-center gap-0.5 rounded-lg py-2 transition-colors ${
              isCurrent
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : iso === today
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-[10px] uppercase opacity-70">{format(day, 'EEEEEE')}</span>
            <span className="text-sm font-semibold tabular-nums">{format(day, 'd')}</span>
            <span
              aria-hidden
              className={`h-1 w-1 rounded-full ${markedDates?.has(iso) ? 'bg-current' : 'bg-transparent'}`}
            />
          </button>
        )
      })}
    </div>
  )
}
