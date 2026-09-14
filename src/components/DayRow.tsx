import { useDroppable } from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { format } from 'date-fns'
import { useMemo, useRef, useState } from 'react'
import { isToday, toISODate, todayISODate } from '../lib/dates'
import { cookDragId, dayDropId } from '../lib/dnd'
import { useIsMobile } from '../lib/responsive'
import { dotClasses } from '../lib/visuals'
import type { Cook, Meal } from '../types'
import CookChip from './CookChip'
import MealDialog from './MealDialog'
import Popover from './Popover'

type ShopDay = { active: boolean; onSet: () => void }

type DayRowProps = {
  date: Date
  cooks: Cook[]
  mealsById: Map<string, Meal>
  activeMeals: Meal[]
  weekDays: Date[]
  /** Whether to label the month — the first row, and wherever a month turns over. */
  showMonth: boolean
  shopDay?: ShopDay
  onAddCook: (mealId: string) => void
  onDeleteCook: (cook: Cook) => void
  onReorderCook: (cookId: string, direction: 'left' | 'right') => void
  onMoveCookToDay: (cookId: string, date: string) => void
  onAddLeftovers: (cook: Cook, date: string) => void
  onQuickLeftovers: (cook: Cook) => void
}

/**
 * One day band in the week view: its cooks side by side, growing as cooks
 * are added. Its own droppable, so an empty day still accepts drops — and
 * the space a day has not filled is itself the add button, which makes the
 * drop target obvious rather than leaving the row half empty. See PLAN.md §6.
 */
export default function DayRow({
  date,
  cooks,
  mealsById,
  activeMeals,
  weekDays,
  showMonth,
  shopDay,
  onAddCook,
  onDeleteCook,
  onReorderCook,
  onMoveCookToDay,
  onAddLeftovers,
  onQuickLeftovers,
}: DayRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  // A search that finds nothing offers to create that meal, which then lands
  // on this day — the point of searching here was to plan it.
  const [creatingName, setCreatingName] = useState<string | null>(null)
  // The date opens the picker as well as the trigger does, so it has to count
  // as inside the popover or its press would read as the click that closes it.
  const dayLabelRef = useRef<HTMLButtonElement>(null)
  const isMobile = useIsMobile()
  const today = isToday(date)
  const iso = toISODate(date)
  const past = iso < todayISODate()
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dayDropId(iso),
    data: { type: 'day', date: iso },
  })

  const filteredMeals = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? activeMeals.filter((meal) => meal.name.toLowerCase().includes(q)) : activeMeals
  }, [activeMeals, query])

  function pickMeal(mealId: string) {
    onAddCook(mealId)
    setPickerOpen(false)
    setQuery('')
  }

  function closePicker() {
    setPickerOpen(false)
    setQuery('')
  }

  function startCreating() {
    setCreatingName(query.trim())
    closePicker()
  }

  return (
    <div
      ref={setDropRef}
      // A phone stacks the day's label above its cooks, so a meal name gets
      // the full width of the row rather than what is left beside a date.
      className={`flex min-h-16 flex-1 flex-col gap-1 border-b border-l-4 border-gray-100 px-2.5 py-2 transition-colors md:min-h-23 md:flex-row md:gap-5 md:px-5 md:py-3 dark:border-gray-800 ${
        today
          ? 'border-l-gray-900 bg-gray-50 dark:border-l-white dark:bg-gray-800/40'
          : 'border-l-transparent'
      } ${isOver ? 'bg-sky-50 ring-2 ring-inset ring-sky-400 dark:bg-sky-950/40 dark:ring-sky-600' : ''}`}
    >
      <div className="flex items-center gap-2 md:w-20 md:flex-shrink-0 md:flex-col md:items-start md:gap-0">
        {/* The date is itself the day's add button, so a day that already has
            cooks can be added to without aiming at the gap beside them. */}
        <button
          ref={dayLabelRef}
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          aria-label={`Add a meal on ${format(date, 'EEEE d MMMM')}`}
          className="flex items-center gap-1.5 rounded-lg text-left transition-colors md:block md:w-full"
        >
          <div
            className={`text-xs font-semibold uppercase tracking-wider ${
              today ? 'text-gray-900 dark:text-white' : past ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {format(date, 'EEE')}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-base font-semibold tabular-nums md:h-9 md:w-9 md:text-xl ${
                today
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : past
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-gray-800 dark:text-gray-200'
              }`}
            >
              {format(date, 'd')}
            </span>
            {showMonth && <span className="text-xs text-gray-400 dark:text-gray-500">{format(date, 'MMM')}</span>}
          </div>
        </button>
        {/* Reserved on every row from `md` up, so a day carrying a shop marker
            is not taller than its neighbours. On a phone it shares the day's
            header line, where an empty slot costs nothing. */}
        <div className="ml-auto md:mt-1.5 md:ml-0 md:h-7">
          {shopDay && (
            <button
              type="button"
              onClick={shopDay.onSet}
              disabled={shopDay.active}
              aria-pressed={shopDay.active}
              title={shopDay.active ? 'Shop day' : 'Move shop day here'}
              className={`flex items-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-medium leading-none transition-colors md:py-1 ${
                shopDay.active
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200'
                  : 'border border-dashed border-gray-300 text-gray-400 hover:border-amber-400 hover:text-amber-600 dark:border-gray-700 dark:text-gray-600 dark:hover:border-amber-500 dark:hover:text-amber-400'
              }`}
            >
              <span className="text-sm leading-none">🛒</span>
              {shopDay.active && <span>Shop</span>}
            </button>
          )}
        </div>
      </div>

      <SortableContext items={cooks.map((cook) => cookDragId(cook.id))} strategy={rectSortingStrategy}>
        <div className="flex min-w-0 flex-1 flex-wrap content-start items-start gap-2">
          {cooks.map((cook, index) => {
            const meal = mealsById.get(cook.mealId)
            if (!meal) return null
            return (
              <CookChip
                key={cook.id}
                cook={cook}
                meal={meal}
                canMoveLeft={index > 0}
                canMoveRight={index < cooks.length - 1}
                weekDays={weekDays}
                onDelete={() => onDeleteCook(cook)}
                onReorder={(direction) => onReorderCook(cook.id, direction)}
                onMoveToDay={(toDate) => onMoveCookToDay(cook.id, toDate)}
                onAddLeftovers={(toDate) => onAddLeftovers(cook, toDate)}
                onQuickLeftovers={() => onQuickLeftovers(cook)}
              />
            )
          })}

          <Popover
            open={pickerOpen}
            onClose={closePicker}
            anchorRef={dayLabelRef}
            className={`h-11 flex-1 md:h-10 md:min-w-[7rem] ${cooks.length === 0 ? 'min-w-[7rem]' : 'min-w-11'}`}
            panelClassName="w-72"
            sheetTitle={`Add a meal on ${format(date, 'EEEE d MMMM')}`}
            trigger={
              <button
                type="button"
                onClick={() => setPickerOpen((open) => !open)}
                aria-label={`Add a meal on ${format(date, 'EEEE d MMMM')}`}
                className={`flex h-full w-full items-center gap-1.5 rounded-xl border border-dashed text-sm transition-colors ${
                  cooks.length === 0
                    ? 'justify-center border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:border-gray-700 dark:text-gray-500 dark:hover:border-gray-600 dark:hover:bg-gray-800/50'
                    : 'justify-center border-transparent text-gray-300 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 md:justify-start md:px-3 dark:text-gray-600 dark:hover:border-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-gray-300'
                }`}
              >
                <span className="text-base leading-none">+</span>
                {cooks.length === 0 ? (
                  <span>
                    Add a meal<span className="hidden md:inline">, or drop one here</span>
                  </span>
                ) : (
                  <span className="hidden md:inline">Add</span>
                )}
              </button>
            }
          >
            {/* Not focused on a phone: the library is a list to point at, and
                a keyboard sliding up over it is the opposite of the gesture. */}
            <input
              type="search"
              autoFocus={!isMobile}
              placeholder="Search meals…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                if (filteredMeals.length > 0) pickMeal(filteredMeals[0].id)
                else if (query.trim()) startCreating()
              }}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base md:text-sm dark:border-gray-700 dark:bg-gray-800"
            />
            <div className="max-h-[50dvh] overflow-y-auto md:max-h-64">
              {filteredMeals.length === 0 && (
                <div className="space-y-2 p-2 text-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {activeMeals.length === 0 ? 'No meals in the library yet.' : 'No meals match.'}
                  </p>
                  <button
                    type="button"
                    onClick={startCreating}
                    className="w-full truncate rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
                  >
                    {query.trim() ? `Create “${query.trim()}”` : 'Create a meal'}
                  </button>
                </div>
              )}
              {filteredMeals.map((meal) => (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => pickMeal(meal.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dotClasses(meal.visual.color)}`} />
                  {meal.visual.icon && <span className="text-base leading-none">{meal.visual.icon}</span>}
                  <span className="truncate">{meal.name}</span>
                </button>
              ))}
            </div>
          </Popover>
        </div>
      </SortableContext>

      {creatingName !== null && (
        <MealDialog
          meal={null}
          initialName={creatingName}
          onCreated={onAddCook}
          onClose={() => setCreatingName(null)}
        />
      )}
    </div>
  )
}
