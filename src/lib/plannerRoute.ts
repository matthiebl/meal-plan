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
  const { anchor, saturday, days } = useMemo(() => {
    const anchor = date ? fromISODate(date) : ym ? fromMonthParam(ym) : new Date()
    const saturday = weekStartSaturday(anchor)
    return { anchor, saturday, days: weekDays(saturday) }
  }, [date, ym])

  return {
    isWeek,
    /** The day the route names; for a month, its first day. */
    anchor,
    /** The Saturday starting the displayed week (or the week holding `anchor`). */
    saturday,
    /** That week's eight days. */
    days,
    showingToday: isWeek ? isCurrentWeek(saturday) : isCurrentMonth(anchor),
    goPrevious: () =>
      navigate(isWeek ? `/week/${toISODate(previousWeek(saturday))}` : `/month/${toMonthParam(previousMonth(anchor))}`),
    goNext: () =>
      navigate(isWeek ? `/week/${toISODate(nextWeek(saturday))}` : `/month/${toMonthParam(nextMonth(anchor))}`),
    goToday: () => {
      const now = new Date()
      navigate(isWeek ? `/week/${toISODate(weekStartSaturday(now))}` : `/month/${toMonthParam(now)}`)
    },
    showWeek: () => navigate(`/week/${toISODate(saturday)}`),
    showMonth: () => navigate(`/month/${toMonthParam(anchor)}`),
  }
}
