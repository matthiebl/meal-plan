import { format } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isToday } from '../lib/dates'
import type { Cook, Meal } from '../types'
import CookChip from './CookChip'

type DayRowProps = {
  date: Date
  cooks: Cook[]
  mealsById: Map<string, Meal>
  activeMeals: Meal[]
  onAddCook: (mealId: string) => void
  onDeleteCook: (cookId: string) => void
}

/** One day band in the week view: its cooks side by side, growing as cooks are added. See PLAN.md §6. */
export default function DayRow({ date, cooks, mealsById, activeMeals, onAddCook, onDeleteCook }: DayRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const today = isToday(date)

  useEffect(() => {
    if (!pickerOpen) return
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [pickerOpen])

  const filteredMeals = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? activeMeals.filter((meal) => meal.name.toLowerCase().includes(q)) : activeMeals
  }, [activeMeals, query])

  function pickMeal(mealId: string) {
    onAddCook(mealId)
    setPickerOpen(false)
    setQuery('')
  }

  return (
    <div
      className={`flex gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800 ${
        today ? 'border-l-2 border-l-gray-900 bg-gray-100 dark:border-l-white dark:bg-gray-900' : ''
      }`}
    >
      <div className="w-14 flex-shrink-0 pt-1 text-xs">
        <div className={`font-semibold ${today ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
          {format(date, 'EEE')}
        </div>
        <div className="text-gray-400 dark:text-gray-600">{format(date, 'MMM d')}</div>
      </div>

      <div className="flex flex-1 flex-wrap items-start gap-2">
        {cooks.map((cook) => {
          const meal = mealsById.get(cook.mealId)
          if (!meal) return null
          return <CookChip key={cook.id} cook={cook} meal={meal} onDelete={() => onDeleteCook(cook.id)} />
        })}

        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            aria-label={`Add a cook on ${format(date, 'EEEE')}`}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:border-gray-700 dark:text-gray-600 dark:hover:border-gray-600 dark:hover:text-gray-400"
          >
            +
          </button>

          {pickerOpen && (
            <div className="absolute left-0 top-8 z-10 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <input
                type="search"
                autoFocus
                placeholder="Search meals…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800"
              />
              <div className="max-h-48 overflow-y-auto">
                {filteredMeals.length === 0 && (
                  <p className="p-2 text-center text-xs text-gray-400 dark:text-gray-600">No meals found.</p>
                )}
                {filteredMeals.map((meal) => (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() => pickMeal(meal.id)}
                    className="flex w-full items-center gap-1 truncate rounded-md px-2 py-1 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {meal.visual.icon ? `${meal.visual.icon} ` : ''}
                    {meal.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
