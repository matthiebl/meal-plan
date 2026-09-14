import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth as isSameMonthFns,
  isToday as isTodayFns,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'

/** Formats a Date as a local 'YYYY-MM-DD' string. */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Parses a 'YYYY-MM-DD' string as a local-midnight Date. Never a UTC parse. */
export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Today, as a 'YYYY-MM-DD' string. */
export function todayISODate(): string {
  return toISODate(new Date())
}

/**
 * The Saturday that starts the week containing `date`. A Saturday is the
 * start of its own week, not the end of the previous one.
 */
export function weekStartSaturday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 6 })
}

/** The eight days of the week starting `saturday`, Saturday through the following Saturday inclusive. */
export function weekDays(saturday: Date): Date[] {
  return eachDayOfInterval({ start: saturday, end: addDays(saturday, 7) })
}

/** The Saturday starting the previous week. */
export function previousWeek(saturday: Date): Date {
  return subWeeks(saturday, 1)
}

/** The Saturday starting the next week. */
export function nextWeek(saturday: Date): Date {
  return addWeeks(saturday, 1)
}

/** The Sunday-to-Saturday, six-row (42-day) grid for the month containing `date`. */
export function monthGrid(date: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(date), { weekStartsOn: 0 })
  return eachDayOfInterval({ start: gridStart, end: addDays(gridStart, 41) })
}

/** The 'YYYY-MM' identifier for the month containing `date`. */
export function toMonthParam(date: Date): string {
  return format(date, 'yyyy-MM')
}

/** Parses a 'YYYY-MM' identifier to the first day of that month, local time. */
export function fromMonthParam(ym: string): Date {
  const [year, month] = ym.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

/** The first day of the month before the one containing `date`. */
export function previousMonth(date: Date): Date {
  return startOfMonth(subMonths(date, 1))
}

/** The first day of the month after the one containing `date`. */
export function nextMonth(date: Date): Date {
  return startOfMonth(addMonths(date, 1))
}

export function isToday(date: Date): boolean {
  return isTodayFns(date)
}

export function isSameDate(a: Date, b: Date): boolean {
  return isSameDay(a, b)
}

export function isSameMonthAs(date: Date, month: Date): boolean {
  return isSameMonthFns(date, month)
}

/** Calendar days from a 'YYYY-MM-DD' string to today. */
export function daysSince(iso: string): number {
  return differenceInCalendarDays(new Date(), fromISODate(iso))
}

/** The day after a 'YYYY-MM-DD' string. */
export function nextISODate(iso: string): string {
  return toISODate(addDays(fromISODate(iso), 1))
}

/**
 * A week as one readable label, e.g. '12 – 19 September' or '27 Sep – 4 Oct'.
 * The year is added only when the week ends outside the current year.
 */
export function formatWeekRange(
  saturday: Date,
  monthFormat: 'MMM' | 'MMMM' = 'MMMM',
): string {
  const end = addDays(saturday, 7)
  const sameMonth = isSameMonthFns(saturday, end)
  const year = end.getFullYear() === new Date().getFullYear() ? '' : ' yyyy'
  return `${format(saturday, sameMonth ? 'd' : 'd MMM')} – ${format(end, `d ${sameMonth ? monthFormat : 'MMM'}${year}`)}`
}

/** Where a week sits relative to now: 'This week', 'Next week', 'Last week', or its year. */
export function formatWeekRelative(saturday: Date): string {
  const offset = Math.round(
    differenceInCalendarDays(saturday, weekStartSaturday(new Date())) / 7,
  )
  if (offset === 0) return 'This week'
  if (offset === 1) return 'Next week'
  if (offset === -1) return 'Last week'
  return format(saturday, 'yyyy')
}

/** A day as briefly as it can be named: its weekday within the coming week, else e.g. '4 Oct'. */
export function formatNearDay(iso: string): string {
  const date = fromISODate(iso)
  const ahead = differenceInCalendarDays(date, new Date())
  return format(date, ahead >= 0 && ahead < 7 ? 'EEE' : 'd MMM')
}

/** A 'YYYY-MM-DD' string as a readable day, e.g. 'Fri 12 Sep'. */
export function formatISODay(iso: string): string {
  return format(fromISODate(iso), 'EEE d MMM')
}

/** True when `saturday` starts the week containing today. */
export function isCurrentWeek(saturday: Date): boolean {
  return isSameDay(saturday, weekStartSaturday(new Date()))
}

/** True when `month` falls in the current calendar month. */
export function isCurrentMonth(month: Date): boolean {
  return isSameMonthFns(month, new Date())
}
