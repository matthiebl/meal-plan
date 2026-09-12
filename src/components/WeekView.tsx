import { useEffect, useMemo, useRef, useState } from 'react'
import { addCook, addLeftovers, deleteCook, moveCook, reorderDay, restoreCook, setShopDate } from '../data/mutations'
import { useWeekMeta } from '../data/useWeekMeta'
import { formatISODay, nextISODate, toISODate, weekDays } from '../lib/dates'
import { cooksOnDate } from '../lib/planner'
import type { Cook, Meal } from '../types'
import DayRow from './DayRow'

const UNDO_WINDOW_MS = 6000

type WeekViewProps = {
  saturday: Date
  meals: Meal[]
  cooks: Cook[]
}

/** A message with an optional undo, shown briefly at the foot of the pane. */
type Toast = { message: string; undo?: () => void }

/** Saturday through the following Saturday, eight day rows. See PLAN.md §6. */
export default function WeekView({ saturday, meals, cooks }: WeekViewProps) {
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

  // Every destructive or off-screen action names what it did and offers an
  // undo for a few seconds. See PLAN.md §6.
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(toastTimeoutRef.current), [])

  function showToast(next: Toast) {
    window.clearTimeout(toastTimeoutRef.current)
    setToast(next)
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), UNDO_WINDOW_MS)
  }

  function runUndo() {
    if (!toast?.undo) return
    window.clearTimeout(toastTimeoutRef.current)
    toast.undo()
    setToast(null)
  }

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
    const newId = addLeftovers({ mealId: cook.mealId, date: toDate, order, fromCookId: cook.id })
    const name = mealsById.get(cook.mealId)?.name ?? 'Leftovers'
    showToast({
      message: `${name} leftovers added to ${formatISODay(toDate)}`,
      undo: () => deleteCook(newId),
    })
  }

  /** The one-click half of the leftovers gesture: tomorrow, the usual answer. */
  function handleQuickLeftovers(cook: Cook) {
    handleAddLeftovers(cook, nextISODate(cook.date))
  }

  function handleDeleteCook(cook: Cook) {
    deleteCook(cook.id)
    const name = mealsById.get(cook.mealId)?.name ?? 'cook'
    showToast({
      message: `Removed ${name} from ${formatISODay(cook.date)}`,
      undo: () => restoreCook(cook),
    })
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* The eight rows share the pane's height rather than bunching at the
            top, growing past their share only when a day fills up. */}
        <div className="flex min-h-full flex-col">
          {days.map((day, index) => {
            const iso = toISODate(day)
            return (
              <DayRow
                key={iso}
                date={day}
                cooks={cooksByDay.get(iso) ?? []}
                mealsById={mealsById}
                activeMeals={activeMeals}
                weekDays={days}
                showMonth={index === 0 || day.getDate() === 1}
                shopDay={shopDayByDate.get(iso)}
                onAddCook={(mealId) => handleAddCook(iso, mealId)}
                onDeleteCook={handleDeleteCook}
                onReorderCook={handleReorderCook}
                onMoveCookToDay={handleMoveCookToDay}
                onAddLeftovers={handleAddLeftovers}
                onQuickLeftovers={handleQuickLeftovers}
              />
            )
          })}
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-full items-center gap-4 rounded-full bg-gray-900 py-2.5 pr-3 pl-5 text-sm text-white shadow-xl dark:bg-white dark:text-gray-900">
            <span className="truncate">{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={runUndo}
                className="flex-shrink-0 rounded-full px-3 py-1 font-semibold underline underline-offset-2 hover:bg-white/15 dark:hover:bg-gray-900/10"
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
