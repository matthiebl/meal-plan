import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DragOverlayChip from './components/DragOverlayChip'
import MealList from './components/MealList'
import Planner from './components/Planner'
import { insertCook, moveCook, reorderDay } from './data/mutations'
import { useCooks } from './data/useCooks'
import { useMeals } from './data/useMeals'
import type { DragData, DropData } from './lib/dnd'
import { cooksOnDate } from './lib/planner'
import type { Cook, Meal } from './types'

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('dark-mode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark-mode', String(dark))
  }, [dark])

  return [dark, setDark] as const
}

type ShellProps = {
  meals: Meal[]
  cooks: Cook[]
  mealsLoading: boolean
}

/**
 * The full-height two-pane shell: meal library on the left, planner on the
 * right. One DndContext wraps both panes, since the meal-card-to-day
 * gesture spans them. See PLAN.md §6.
 */
function Shell({ meals, cooks, mealsLoading }: ShellProps) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag((event.active.data.current as DragData | undefined) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as DragData | undefined
    const overData = over.data.current as DropData | undefined
    if (!activeData || !overData) return

    const destDate = overData.type === 'day' ? overData.date : overData.cook.date

    if (activeData.type === 'meal' || activeData.type === 'leftovers') {
      const destIds = cooksOnDate(cooks, destDate).map((c) => c.id)
      const overIndex = overData.type === 'cook' ? destIds.indexOf(overData.cook.id) : -1
      const index = overIndex >= 0 ? overIndex : destIds.length

      if (activeData.type === 'meal') {
        insertCook({ mealId: activeData.meal.id, date: destDate, kind: 'cook' }, destIds, index)
      } else {
        insertCook(
          { mealId: activeData.cook.mealId, date: destDate, kind: 'leftovers', fromCookId: activeData.cook.id },
          destIds,
          index,
        )
      }
      return
    }

    // activeData.type === 'cook': reindex within a day, or move across days.
    const cook = activeData.cook
    if (overData.type === 'cook' && overData.cook.id === cook.id) return

    const destExisting = cooksOnDate(cooks, destDate)
      .filter((c) => c.id !== cook.id)
      .map((c) => c.id)
    const overIndex = overData.type === 'cook' ? destExisting.indexOf(overData.cook.id) : -1
    const index = overIndex >= 0 ? overIndex : destExisting.length
    const destIds = [...destExisting.slice(0, index), cook.id, ...destExisting.slice(index)]

    if (cook.date === destDate) {
      const current = cooksOnDate(cooks, destDate).map((c) => c.id)
      if (destIds.join() === current.join()) return
      reorderDay(destIds)
    } else {
      const originIds = cooksOnDate(cooks, cook.date)
        .filter((c) => c.id !== cook.id)
        .map((c) => c.id)
      moveCook(cook.id, destDate, originIds, destIds)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="overflow-y-auto border-b border-gray-200 md:w-96 md:flex-shrink-0 md:border-b-0 md:border-r dark:border-gray-800">
          <MealList meals={meals} cooks={cooks} loading={mealsLoading} />
        </aside>
        <section className="flex-1 overflow-hidden">
          <Planner meals={meals} cooks={cooks} />
        </section>
      </div>
      <DragOverlay>{activeDrag && <DragOverlayChip data={activeDrag} />}</DragOverlay>
    </DndContext>
  )
}

function App() {
  const [dark, setDark] = useDarkMode()
  const { meals, loading: mealsLoading } = useMeals()
  const { cooks } = useCooks()

  return (
    <BrowserRouter>
      <div className="flex h-screen flex-col bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
          <span className="text-lg font-semibold">Meal Plan</span>
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 15a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm9-8a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1ZM4 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1Zm14.95-6.364a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0ZM7.172 16.828a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0ZM18.95 18.95a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 1 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414ZM7.172 7.172a1 1 0 0 1-1.414 0l-.707-.707A1 1 0 0 1 6.465 5.05l.707.707a1 1 0 0 1 0 1.414ZM12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
              </svg>
            )}
          </button>
        </header>

        <Routes>
          <Route path="/" element={<Shell meals={meals} cooks={cooks} mealsLoading={mealsLoading} />} />
          <Route path="/week/:date" element={<Shell meals={meals} cooks={cooks} mealsLoading={mealsLoading} />} />
          <Route path="/month/:ym" element={<Shell meals={meals} cooks={cooks} mealsLoading={mealsLoading} />} />
          <Route path="*" element={<Shell meals={meals} cooks={cooks} mealsLoading={mealsLoading} />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
