import {
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
import { format } from 'date-fns'
import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DragOverlayChip from './components/DragOverlayChip'
import MealList from './components/MealList'
import Planner from './components/Planner'
import { insertCook, moveCook, reorderDay } from './data/mutations'
import { useCooks } from './data/useCooks'
import { useMeals } from './data/useMeals'
import { collisionDetection, type DragData, type DropData } from './lib/dnd'
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

/** Which pane a phone shows. Both panes are always on screen from `md` up. */
type Tab = 'plan' | 'meals'

type ShellProps = {
  meals: Meal[]
  cooks: Cook[]
  mealsLoading: boolean
  tab: Tab
}

/**
 * The full-height two-pane shell: meal library on the left, planner on the
 * right. One DndContext wraps both panes, since the meal-card-to-day
 * gesture spans them. See PLAN.md §6.
 */
function Shell({ meals, cooks, mealsLoading, tab }: ShellProps) {
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
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`w-full min-w-0 overflow-hidden border-gray-200 bg-white md:block md:w-[21rem] md:flex-shrink-0 md:border-r lg:w-[24rem] xl:w-[27rem] dark:border-gray-800 dark:bg-gray-900 ${
            tab === 'meals' ? 'block' : 'hidden'
          }`}
        >
          <MealList meals={meals} cooks={cooks} loading={mealsLoading} />
        </aside>
        <section
          className={`min-w-0 flex-1 overflow-hidden bg-white md:block dark:bg-gray-900 ${
            tab === 'plan' ? 'block' : 'hidden'
          }`}
        >
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
  const [tab, setTab] = useState<Tab>('plan')

  const shell = <Shell meals={meals} cooks={cooks} mealsLoading={mealsLoading} tab={tab} />

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="flex h-dvh flex-col bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
        {/* No title bar on a phone: the pane's own header says where you are,
            and the height it would take is eight day rows' worth. */}
        <header className="hidden h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 md:flex dark:border-gray-800 dark:bg-gray-900">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-gray-900 text-xl dark:bg-gray-800">
              🍽️
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight">Meal Plan</h1>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(), 'EEEE d MMMM')}
              </p>
            </div>
          </div>
          <ThemeToggle
            dark={dark}
            onToggle={() => setDark((d) => !d)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          />
        </header>

        <Routes>
          <Route path="/" element={shell} />
          <Route path="/week/:date" element={shell} />
          <Route path="/month/:ym" element={shell} />
          <Route path="*" element={shell} />
        </Routes>

        <nav
          aria-label="Panes"
          className="flex flex-shrink-0 items-stretch border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-gray-800 dark:bg-gray-900"
        >
          <TabButton active={tab === 'plan'} onClick={() => setTab('plan')} label="Plan">
            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 8H5v9h14v-9Z" />
          </TabButton>
          <TabButton active={tab === 'meals'} onClick={() => setTab('meals')} label="Meals">
            <path d="M12 3c4.97 0 9 3.58 9 8H3c0-4.42 4.03-8 9-8Zm-9 10h18a1 1 0 0 1 0 2H3a1 1 0 1 1 0-2Zm2 4h14a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" />
          </TabButton>
          <ThemeToggle
            dark={dark}
            onToggle={() => setDark((d) => !d)}
            className="flex w-14 flex-shrink-0 items-center justify-center text-gray-400 dark:text-gray-500"
          />
        </nav>
      </div>
    </BrowserRouter>
  )
}

type TabButtonProps = {
  active: boolean
  onClick: () => void
  label: string
  /** The icon's path data, drawn in a 24×24 box. */
  children: ReactNode
}

function TabButton({ active, onClick, label, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
        active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
      }`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-6 w-6">
        {children}
      </svg>
      {label}
    </button>
  )
}

function ThemeToggle({ dark, onToggle, className }: { dark: boolean; onToggle: () => void; className: string }) {
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button type="button" onClick={onToggle} aria-label={label} title={label} className={className}>
      {dark ? (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
          <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 15a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm9-8a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1ZM4 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1Zm14.95-6.364a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0ZM7.172 16.828a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0ZM18.95 18.95a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 1 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414ZM7.172 7.172a1 1 0 0 1-1.414 0l-.707-.707A1 1 0 0 1 6.465 5.05l.707.707a1 1 0 0 1 0 1.414ZM12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
        </svg>
      )}
    </button>
  )
}

export default App
