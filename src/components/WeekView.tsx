import { format } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addCook, addLeftovers, deleteCook, moveCook, reorderDay, restoreCook, setShopDate } from '../data/mutations'
import { useWeekMeta } from '../data/useWeekMeta'
import { fromISODate, nextWeek, previousWeek, toISODate, weekDays } from '../lib/dates'
import { cooksOnDate } from '../lib/planner'
import type { Cook, Meal } from '../types'
import DayRow from './DayRow'

const UNDO_WINDOW_MS = 6000

type WeekViewProps = {
  saturday: Date
  meals: Meal[]
  cooks: Cook[]
}

/** Saturday through the following Saturday, eight day rows. See PLAN.md §6. */
export default function WeekView({ saturday, meals, cooks }: WeekViewProps) {
  const navigate = useNavigate()

  const mealsById = useMemo(() => new Map(meals.map((meal) => [meal.id, meal])), [meals])
  const activeMeals = useMemo(() => meals.filter((meal) => !meal.archived), [meals])
  const days = useMemo(() => weekDays(saturday), [saturday])

  const cooksByDay = useMemo(() => {
    const map = new Map<string, Cook[]>()
    for (const day of days) map.set(toISODate(day), cooksOnDate(cooks, toISODate(day)))
    return map
  }, [days, cooks])

  // Both Saturdays shown carry their own shop-day marker, each defaulting to
  // its own Saturday but movable to the Sunday right after. See PLAN.md §6.
  const startSaturdayISO = toISODate(days[0])
  const startSundayISO = toISODate(days[1])
  const endSaturdayISO = toISODate(days[7])
  const startWeekShopDate = useWeekMeta(startSaturdayISO)
  const endWeekShopDate = useWeekMeta(endSaturdayISO)

  const shopDayByDate = useMemo(() => {
    const map = new Map<string, { active: boolean; onSet: () => void }>()
    map.set(startSaturdayISO, {
      active: startWeekShopDate === startSaturdayISO,
      onSet: () => setShopDate(startSaturdayISO, startSaturdayISO),
    })
    map.set(startSundayISO, {
      active: startWeekShopDate === startSundayISO,
      onSet: () => setShopDate(startSaturdayISO, startSundayISO),
    })
    map.set(endSaturdayISO, {
      active: endWeekShopDate === endSaturdayISO,
      onSet: () => setShopDate(endSaturdayISO, endSaturdayISO),
    })
    return map
  }, [startSaturdayISO, startSundayISO, endSaturdayISO, startWeekShopDate, endWeekShopDate])

  function handleAddCook(date: string, mealId: string) {
    const order = cooksByDay.get(date)?.length ?? 0
    addCook({ mealId, date, kind: 'cook', order })
  }

  // Click/keyboard equivalents for the drag gestures in PLAN.md §6.
  function handleReorderCook(cookId: string, direction: 'left' | 'right') {
    const cook = cooks.find((c) => c.id === cookId)
    if (!cook) return
    const dayIds = cooksOnDate(cooks, cook.date).map((c) => c.id)
    const index = dayIds.indexOf(cookId)
    const swapWith = direction === 'left' ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= dayIds.length) return
    const reordered = [...dayIds]
    ;[reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]]
    reorderDay(reordered)
  }

  function handleMoveCookToDay(cookId: string, toDate: string) {
    const cook = cooks.find((c) => c.id === cookId)
    if (!cook || cook.date === toDate) return
    const originIds = cooksOnDate(cooks, cook.date)
      .filter((c) => c.id !== cookId)
      .map((c) => c.id)
    const destIds = [...cooksOnDate(cooks, toDate).map((c) => c.id), cookId]
    moveCook(cookId, toDate, originIds, destIds)
  }

  function handleAddLeftovers(cook: Cook, toDate: string) {
    const order = cooksOnDate(cooks, toDate).length
    addLeftovers({ mealId: cook.mealId, date: toDate, order, fromCookId: cook.id })
  }

  // A deleted cook can be brought back for a few seconds before it is gone
  // for good — deleteCook is otherwise the only hard, undoable-by-nothing
  // delete in the app. See PLAN.md §6.
  const [pendingUndo, setPendingUndo] = useState<Cook | null>(null)
  const undoTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(undoTimeoutRef.current), [])

  function handleDeleteCook(cook: Cook) {
    deleteCook(cook.id)
    window.clearTimeout(undoTimeoutRef.current)
    setPendingUndo(cook)
    undoTimeoutRef.current = window.setTimeout(() => setPendingUndo(null), UNDO_WINDOW_MS)
  }

  function handleUndoDelete() {
    if (!pendingUndo) return
    window.clearTimeout(undoTimeoutRef.current)
    restoreCook(pendingUndo)
    setPendingUndo(null)
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-800">
        <button
          type="button"
          onClick={() => navigate(`/week/${toISODate(previousWeek(saturday))}`)}
          className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          ← Previous
        </button>
        <span className="text-sm font-medium">
          {toISODate(saturday)} – {toISODate(days[days.length - 1])}
        </span>
        <button
          type="button"
          onClick={() => navigate(`/week/${toISODate(nextWeek(saturday))}`)}
          className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Next →
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {days.map((day) => {
          const iso = toISODate(day)
          return (
            <DayRow
              key={iso}
              date={day}
              cooks={cooksByDay.get(iso) ?? []}
              mealsById={mealsById}
              activeMeals={activeMeals}
              weekDays={days}
              shopDay={shopDayByDate.get(iso)}
              onAddCook={(mealId) => handleAddCook(iso, mealId)}
              onDeleteCook={handleDeleteCook}
              onReorderCook={handleReorderCook}
              onMoveCookToDay={handleMoveCookToDay}
              onAddLeftovers={handleAddLeftovers}
            />
          )
        })}
      </div>

      {pendingUndo && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-gray-900 px-4 py-2 text-xs text-white shadow-lg dark:bg-white dark:text-gray-900">
            <span>
              Removed {mealsById.get(pendingUndo.mealId)?.name ?? 'cook'} from{' '}
              {format(fromISODate(pendingUndo.date), 'EEE d')}
            </span>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="font-semibold underline underline-offset-2"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
