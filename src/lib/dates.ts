import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday as isTodayFns,
  startOfMonth,
  startOfWeek,
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

export function isToday(date: Date): boolean {
  return isTodayFns(date)
}

export function isSameDate(a: Date, b: Date): boolean {
  return isSameDay(a, b)
}
