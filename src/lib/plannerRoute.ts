import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  fromISODate,
  fromMonthParam,
  isCurrentMonth,
  isCurrentWeek,
  nextMonth,
  nextWeek,
  previousMonth,
  previousWeek,
  toISODate,
  toMonthParam,
  weekDays,
  weekStartSaturday,
} from './dates'

/**
 * What the planner is showing, read from the route, and the moves between
 * weeks and months. Shared by everything that has to agree about it: the
 * toolbar in the desktop header, the phone's planner header, both views, and
 * the meal library, which plans onto the displayed week. See PLAN.md §6.
 */
export function usePlannerRoute() {
  const { date, ym } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const isWeek = !pathname.startsWith('/month')
  // The shopping list is a route over its week, so every move between weeks
  // carries it along rather than dismissing it. See PLAN.md §6.
  const isShop = pathname.endsWith('/shop')
  const weekPath = (day: Date) =>
    `/week/${toISODate(day)}${isShop ? '/shop' : ''}`
  const { anchor, saturday, days } = useMemo(() => {
    const anchor = date
      ? fromISODate(date)
      : ym
        ? fromMonthParam(ym)
        : new Date()
    const saturday = weekStartSaturday(anchor)
    return { anchor, saturday, days: weekDays(saturday) }
  }, [date, ym])

  return {
    isWeek,
    /** Whether the shopping list is open over the week. */
    isShop,
    /** The day the route names; for a month, its first day. */
    anchor,
    /** The Saturday starting the displayed week (or the week holding `anchor`). */
    saturday,
    /** That week's eight days. */
    days,
    showingToday: isWeek ? isCurrentWeek(saturday) : isCurrentMonth(anchor),
    goPrevious: () =>
      navigate(
        isWeek
          ? weekPath(previousWeek(saturday))
          : `/month/${toMonthParam(previousMonth(anchor))}`,
      ),
    goNext: () =>
      navigate(
        isWeek
          ? weekPath(nextWeek(saturday))
          : `/month/${toMonthParam(nextMonth(anchor))}`,
      ),
    goToday: () => {
      const now = new Date()
      navigate(
        isWeek
          ? weekPath(weekStartSaturday(now))
          : `/month/${toMonthParam(now)}`,
      )
    },
    showWeek: () => navigate(weekPath(saturday)),
    /** A month has no shopping list of its own, so this leaves the list. */
    showMonth: () => navigate(`/month/${toMonthParam(anchor)}`),
  }
}
