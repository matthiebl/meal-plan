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
import { useEffect, useRef, useState } from 'react'
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import DragOverlayChip from './components/DragOverlayChip'
import Icon, { type IconName } from './components/Icon'
import MealList from './components/MealList'
import Planner from './components/Planner'
import { PlannerToolbar } from './components/PlannerToolbar'
import ShoppingList from './components/ShoppingList'
import { insertCook, moveCook, reorderDay } from './data/mutations'
import { useCooks } from './data/useCooks'
import { useIngredients } from './data/useIngredients'
import { useMeals } from './data/useMeals'
import { toISODate } from './lib/dates'
import { collisionDetection, type DragData, type DropData } from './lib/dnd'
import { cooksOnDate } from './lib/planner'
import { usePlannerRoute } from './lib/plannerRoute'
import { useIsMobile } from './lib/responsive'
import { currentShopWeekSaturday } from './lib/shopping'
import type { Cook, Ingredient, Meal } from './types'

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

/**
 * Which of the planner and the library a phone shows. Both are always on
 * screen from `md` up. The shopping list is the third pane below `md`, and is
 * route state rather than a tab, because it is a route at every width.
 */
type Tab = 'plan' | 'meals'

type ShellProps = {
  meals: Meal[]
  cooks: Cook[]
  ingredients: Ingredient[]
  mealsLoading: boolean
  tab: Tab
  onTabChange: (tab: Tab) => void
  dark: boolean
  onToggleDark: () => void
}

/**
 * The full-height shell: meal library on the left, planner on the right, and
 * below `md` the shopping list as a third pane in their place. Beneath a
 * header from `md` up and above a tab bar below it. It is the element of every
 * route, because the header carries the planner's toolbar and so has to read
 * the route. One DndContext wraps both planning panes, since the
 * meal-card-to-day gesture spans them. See PLAN.md §6.
 */
function Shell({
  meals,
  cooks,
  ingredients,
  mealsLoading,
  tab,
  onTabChange,
  dark,
  onToggleDark,
}: ShellProps) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const { saturday, isShop } = usePlannerRoute()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // Below `md` the list is a pane and above it a sheet, so the markup itself
  // differs rather than only its layout. See lib/responsive.ts.
  const isMobile = useIsMobile()

  // Where leaving the list returns to. The Shop tab opens the week whose shop
  // is next, which is not necessarily the week the planner was showing, so
  // tapping Shop and then Plan must not lose the planner's place.
  const plannerPath = useRef('/')
  useEffect(() => {
    if (!isShop) plannerPath.current = pathname
  }, [isShop, pathname])

  function leaveShop() {
    navigate(plannerPath.current)
  }

  function showTab(next: Tab) {
    onTabChange(next)
    if (isShop) leaveShop()
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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

    const destDate =
      overData.type === 'day' ? overData.date : overData.cook.date

    if (activeData.type === 'meal' || activeData.type === 'leftovers') {
      const destIds = cooksOnDate(cooks, destDate).map(c => c.id)
      const overIndex =
        overData.type === 'cook' ? destIds.indexOf(overData.cook.id) : -1
      const index = overIndex >= 0 ? overIndex : destIds.length

      if (activeData.type === 'meal') {
        insertCook(
          { mealId: activeData.meal.id, date: destDate, kind: 'cook' },
          destIds,
          index,
        )
      } else {
        insertCook(
          {
            mealId: activeData.cook.mealId,
            date: destDate,
            kind: 'leftovers',
            fromCookId: activeData.cook.id,
          },
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
      .filter(c => c.id !== cook.id)
      .map(c => c.id)
    const overIndex =
      overData.type === 'cook' ? destExisting.indexOf(overData.cook.id) : -1
    const index = overIndex >= 0 ? overIndex : destExisting.length
    const destIds = [
      ...destExisting.slice(0, index),
      cook.id,
      ...destExisting.slice(index),
    ]

    if (cook.date === destDate) {
      const current = cooksOnDate(cooks, destDate).map(c => c.id)
      if (destIds.join() === current.join()) return
      reorderDay(destIds)
    } else {
      const originIds = cooksOnDate(cooks, cook.date)
        .filter(c => c.id !== cook.id)
        .map(c => c.id)
      moveCook(cook.id, destDate, originIds, destIds)
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-surface-2 text-ink">
      {/* No header on a phone: each pane titles itself, and the height a
          header would take is a day row's worth. */}
      <header className="hidden h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-line px-4 md:grid">
        <h1 className="text-[15px] font-medium">Meal plan</h1>
        <PlannerToolbar />
        <div className="flex items-center justify-self-end">
          <ShopButton
            active={isShop}
            onClick={() => navigate(`/week/${toISODate(saturday)}/shop`)}
          />
          <ThemeToggle dark={dark} onToggle={onToggleDark} />
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={`w-full min-w-0 overflow-hidden border-line md:block md:w-88 md:shrink-0 md:border-r lg:w-96 ${
              !isShop && tab === 'meals' ? 'block' : 'hidden'
            }`}
          >
            <MealList
              meals={meals}
              cooks={cooks}
              ingredients={ingredients}
              loading={mealsLoading}
              headerAction={<ThemeToggle dark={dark} onToggle={onToggleDark} />}
            />
          </aside>
          <section
            className={`min-w-0 flex-1 overflow-hidden md:block ${!isShop && tab === 'plan' ? 'block' : 'hidden'}`}
          >
            <Planner meals={meals} cooks={cooks} ingredients={ingredients} />
          </section>
          {isShop && isMobile && (
            <section className="min-w-0 flex-1 overflow-hidden md:hidden">
              <ShoppingList
                variant="pane"
                saturdayISO={toISODate(saturday)}
                meals={meals}
                cooks={cooks}
                ingredients={ingredients}
                onClose={leaveShop}
              />
            </section>
          )}
        </div>
        <DragOverlay>
          {activeDrag && <DragOverlayChip data={activeDrag} />}
        </DragOverlay>
      </DndContext>

      <nav
        aria-label="Panes"
        className="flex shrink-0 items-stretch border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <TabButton
          active={!isShop && tab === 'plan'}
          onClick={() => showTab('plan')}
          label="Plan"
          icon="calendar"
        />
        <TabButton
          active={!isShop && tab === 'meals'}
          onClick={() => showTab('meals')}
          label="Meals"
          icon="list"
        />
        <TabButton
          active={isShop}
          onClick={() => navigate(`/week/${currentShopWeekSaturday()}/shop`)}
          label="Shop"
          icon="bag"
        />
      </nav>

      {/* A sheet over the week from `md` up; the pane above stands in for it
          below. See PLAN.md §6. */}
      {isShop && !isMobile && (
        <ShoppingList
          variant="sheet"
          saturdayISO={toISODate(saturday)}
          meals={meals}
          cooks={cooks}
          ingredients={ingredients}
          onClose={leaveShop}
        />
      )}
    </div>
  )
}

function App() {
  const [dark, setDark] = useDarkMode()
  const { meals, loading: mealsLoading } = useMeals()
  const { cooks } = useCooks()
  const { ingredients } = useIngredients()
  const [tab, setTab] = useState<Tab>('plan')

  const shell = (
    <Shell
      meals={meals}
      cooks={cooks}
      ingredients={ingredients}
      mealsLoading={mealsLoading}
      tab={tab}
      onTabChange={setTab}
      dark={dark}
      onToggleDark={() => setDark(d => !d)}
    />
  )

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={shell} />
        <Route path="/week/:date" element={shell} />
        <Route path="/week/:date/shop" element={shell} />
        <Route path="/month/:ym" element={shell} />
        <Route path="*" element={shell} />
      </Routes>
    </BrowserRouter>
  )
}

type TabButtonProps = {
  active: boolean
  onClick: () => void
  label: string
  icon: IconName
}

function TabButton({ active, onClick, label, icon }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 flex-col items-center gap-0.75 py-2.5 text-xs transition-colors ${
        active ? 'text-ink' : 'text-ink-3'
      }`}
    >
      <Icon name={icon} className="h-5 w-5" />
      {label}
    </button>
  )
}

/** The way into the week's shopping list from the desktop header. */
function ShopButton({
  active,
  onClick,
}: {
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Shopping list"
      aria-pressed={active}
      title="Shopping list"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-1 ${
        active ? 'text-accent' : 'text-ink-3 hover:text-ink'
      }`}
    >
      <Icon name="bag" />
    </button>
  )
}

function ThemeToggle({
  dark,
  onToggle,
}: {
  dark: boolean
  onToggle: () => void
}) {
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-1 hover:text-ink"
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  )
}

export default App
