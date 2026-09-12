import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { addCook, deleteCook } from '../data/mutations'
import { nextWeek, previousWeek, toISODate, weekDays } from '../lib/dates'
import type { Cook, Meal } from '../types'
import DayRow from './DayRow'

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
    for (const day of days) map.set(toISODate(day), [])
    for (const cook of cooks) {
      map.get(cook.date)?.push(cook)
    }
    for (const dayCooks of map.values()) dayCooks.sort((a, b) => a.order - b.order)
    return map
  }, [days, cooks])

  function handleAddCook(date: string, mealId: string) {
    const order = cooksByDay.get(date)?.length ?? 0
    addCook({ mealId, date, kind: 'cook', order })
  }

  return (
    <div className="flex h-full flex-col">
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

      <div className="flex-1 overflow-y-auto">
        {days.map((day) => {
          const iso = toISODate(day)
          return (
            <DayRow
              key={iso}
              date={day}
              cooks={cooksByDay.get(iso) ?? []}
              mealsById={mealsById}
              activeMeals={activeMeals}
              onAddCook={(mealId) => handleAddCook(iso, mealId)}
              onDeleteCook={deleteCook}
            />
          )
        })}
      </div>
    </div>
  )
}
