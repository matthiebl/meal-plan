import { useDroppable } from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { format } from 'date-fns'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { isToday, todayISODate, toISODate } from '../lib/dates'
import { cookDragId, dayDropId } from '../lib/dnd'
import { sortMeals } from '../lib/mealSort'
import { useIsMobile } from '../lib/responsive'
import type { Cook, Meal, MealStats } from '../types'
import CookChip from './CookChip'
import Icon from './Icon'
import MealDialog from './MealDialog'
import MealSummary, { MEAL_CARD_CLASSES, PLANNED_OUTLINE } from './MealSummary'
import Popover from './Popover'

type ShopDay = { active: boolean; onSet: () => void }

type DayRowProps = {
  date: Date
  cooks: Cook[]
  mealsById: Map<string, Meal>
  activeMeals: Meal[]
  statsFor: (meal: Meal) => MealStats
  /** Each cook's detail line, for the phone's cook cards. */
  cookDetails: Map<string, string>
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
 * One day in the week view, and its own droppable, so an empty day still
 * accepts drops. Its cooks are the same cards at every width. From `md` up the
 * day is a band: the date, the cards side by side, and the space they have
 * not filled as the day's add button. On a phone it is a section of a
 * scrolling list: the date as a heading, and the cards full-width beneath
 * it. See PLAN.md §6.
 */
export default function DayRow({
  date,
  cooks,
  mealsById,
  activeMeals,
  statsFor,
  cookDetails,
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

  // Longest since cooked first: the picker's question is what to have, and
  // the library's default sort already answers it.
  const pickableMeals = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matching = q
      ? activeMeals.filter(meal => meal.name.toLowerCase().includes(q))
      : activeMeals
    return sortMeals(matching, statsFor, 'daysSince')
  }, [activeMeals, query, statsFor])

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

  const togglePicker = () => setPickerOpen(open => !open)
  const fullDate = format(date, 'EEEE d MMMM')
  const dayLabel = format(date, showMonth ? 'EEE d MMM' : 'EEE d')

  const chips = (
    <SortableContext
      items={cooks.map(cook => cookDragId(cook.id))}
      strategy={rectSortingStrategy}
    >
      {cooks.map((cook, index) => {
        const meal = mealsById.get(cook.mealId)
        if (!meal) return null
        return (
          <CookChip
            key={cook.id}
            cook={cook}
            meal={meal}
            onTodayRow={today}
            detail={cookDetails.get(cook.id) ?? ''}
            canMoveLeft={index > 0}
            canMoveRight={index < cooks.length - 1}
            weekDays={weekDays}
            onDelete={() => onDeleteCook(cook)}
            onReorder={direction => onReorderCook(cook.id, direction)}
            onMoveToDay={toDate => onMoveCookToDay(cook.id, toDate)}
            onAddLeftovers={toDate => onAddLeftovers(cook, toDate)}
            onQuickLeftovers={() => onQuickLeftovers(cook)}
          />
        )
      })}
    </SortableContext>
  )

  const picker = (trigger: ReactNode, className: string) => (
    <Popover
      open={pickerOpen}
      onClose={closePicker}
      anchorRef={dayLabelRef}
      className={className}
      panelClassName="w-96"
      sheetTitle={`Add to ${format(date, 'EEE d')}`}
      sheetSubtitle="Longest since cooked first"
      trigger={trigger}
    >
      {/* Not focused on a phone: the library is a list to point at, and
          a keyboard sliding up over it is the opposite of the gesture. */}
      <label className="mb-2.5 flex items-center gap-2 rounded-xl bg-surface-1 px-3 text-ink-3 focus-within:outline-2 focus-within:outline-accent">
        <Icon name="search" className="h-4.5 w-4.5" />
        <input
          type="search"
          autoFocus={!isMobile}
          placeholder="Search meals"
          aria-label="Search meals"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key !== 'Enter') return
            if (pickableMeals.length > 0) pickMeal(pickableMeals[0].id)
            else if (query.trim()) startCreating()
          }}
          className="h-10 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none md:text-[15px]"
        />
      </label>
      <div className="max-h-[55dvh] space-y-2 overflow-y-auto md:max-h-[26rem]">
        {pickableMeals.length === 0 && (
          <p className="px-1 py-2 text-center text-sm text-ink-3">
            {activeMeals.length === 0
              ? 'No meals in the library yet.'
              : 'No meals match.'}
          </p>
        )}
        {pickableMeals.map(meal => {
          const stats = statsFor(meal)
          return (
            <button
              key={meal.id}
              type="button"
              onClick={() => pickMeal(meal.id)}
              className={`${MEAL_CARD_CLASSES} hover:bg-line ${stats.nextPlanned ? PLANNED_OUTLINE : ''}`}
            >
              <MealSummary meal={meal} stats={stats} />
            </button>
          )
        })}
        <button
          type="button"
          onClick={startCreating}
          className="flex w-full items-center gap-2.5 rounded-2xl border border-dashed border-line-strong p-3.5 text-left text-sm text-ink-3 hover:text-ink-2"
        >
          <Icon name="plus" className="h-4.5 w-4.5" />
          <span className="truncate">
            {query.trim() ? `Create “${query.trim()}”` : 'New meal'}
          </span>
        </button>
      </div>
    </Popover>
  )

  const dialog = creatingName !== null && (
    <MealDialog
      meal={null}
      initialName={creatingName}
      onCreated={onAddCook}
      onClose={() => setCreatingName(null)}
    />
  )

  if (isMobile) {
    return (
      <section
        ref={setDropRef}
        aria-label={fullDate}
        className={`rounded-2xl pb-2 transition-colors ${isOver ? 'bg-accent-soft ring-2 ring-accent' : ''}`}
      >
        <div className="flex h-11 items-center gap-2 pt-2">
          {/* The date is itself the day's add button. */}
          <button
            ref={dayLabelRef}
            type="button"
            onClick={togglePicker}
            aria-label={`Add a meal on ${fullDate}`}
            className={`min-w-0 truncate rounded text-left text-[13px] ${
              today
                ? 'font-medium text-accent'
                : past
                  ? 'text-ink-3/70'
                  : 'text-ink-3'
            }`}
          >
            {today ? `Today · ${dayLabel}` : dayLabel}
          </button>
          <div className="ml-auto flex items-center">
            {shopDay && <ShopMarker shopDay={shopDay} />}
            {cooks.length > 0 && (
              <button
                type="button"
                onClick={togglePicker}
                aria-label={`Add another meal on ${fullDate}`}
                className="-mr-1.5 flex h-9 w-9 items-center justify-center rounded-full text-ink-3 hover:bg-surface-1"
              >
                <Icon name="plus" className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {chips}
          {picker(
            cooks.length === 0 ? (
              <button
                type="button"
                onClick={togglePicker}
                aria-label={`Add a meal on ${fullDate}`}
                className="flex w-full items-center gap-2.5 rounded-2xl border border-dashed border-line-strong p-3.5 text-left text-sm text-ink-3"
              >
                <Icon name="plus" className="h-4.5 w-4.5" />
                Add a meal
              </button>
            ) : null,
            // Holds nothing once the day has cooks: the picker is a portalled sheet.
            'relative empty:hidden',
          )}
        </div>

        {dialog}
      </section>
    )
  }

  return (
    <div
      ref={setDropRef}
      className={`flex min-h-20 flex-1 items-center gap-3 border-b px-3 py-2 transition-colors ${
        today ? 'rounded-xl border-transparent bg-accent-soft' : 'border-line'
      } ${isOver ? 'ring-2 ring-accent ring-inset' : ''}`}
    >
      <div className="w-16 shrink-0">
        {/* The date is itself the day's add button, so a day that already has
            cooks can be added to without aiming at the gap beside them. */}
        <button
          ref={dayLabelRef}
          type="button"
          onClick={togglePicker}
          aria-label={`Add a meal on ${fullDate}`}
          className={`rounded text-left text-[13px] leading-tight tabular-nums ${
            today
              ? 'font-medium text-accent'
              : past
                ? 'text-ink-3/70'
                : 'text-ink-3'
          }`}
        >
          {today && <span className="block text-xs">Today</span>}
          {dayLabel}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap content-start items-start gap-2">
        {chips}
        {picker(
          <button
            type="button"
            onClick={togglePicker}
            aria-label={`Add a meal on ${fullDate}`}
            className={`flex h-full w-full items-center gap-2.5 rounded-2xl border border-dashed px-4 text-sm transition-colors ${
              cooks.length === 0
                ? 'border-line-strong text-ink-3 hover:text-ink-2'
                : 'border-transparent text-transparent hover:border-line-strong hover:text-ink-3 focus-visible:text-ink-3'
            }`}
          >
            <Icon name="plus" className="h-4.5 w-4.5" />
            {cooks.length === 0 ? 'Add a meal, or drop one here' : 'Add'}
          </button>,
          `relative h-16 flex-1 ${cooks.length === 0 ? 'min-w-48' : 'min-w-12'}`,
        )}
      </div>

      {/* Reserved on every row, so a day carrying a shop marker is no
          narrower than its neighbours. */}
      <div className="flex w-14 shrink-0 justify-end">
        {shopDay && <ShopMarker shopDay={shopDay} />}
      </div>

      {dialog}
    </div>
  )
}

/**
 * The shop-day marker on a Saturday, or on the Sunday it can move to. Where
 * the shop is not, the marker is a faint bag to tap, so it can be moved there.
 */
function ShopMarker({ shopDay }: { shopDay: ShopDay }) {
  return (
    <button
      type="button"
      onClick={shopDay.onSet}
      disabled={shopDay.active}
      aria-pressed={shopDay.active}
      aria-label={shopDay.active ? 'Shop day' : 'Move shop day here'}
      title={shopDay.active ? 'Shop day' : 'Move shop day here'}
      className={`flex h-7 items-center gap-1 rounded-md px-1.5 text-xs md:h-6 md:px-1 md:text-[11px] ${
        shopDay.active ? 'text-ink-2' : 'text-ink-3/40 hover:text-ink-3'
      }`}
    >
      <Icon name="bag" className="h-4 w-4 md:h-3.5 md:w-3.5" />
      {shopDay.active && 'Shop'}
    </button>
  )
}
