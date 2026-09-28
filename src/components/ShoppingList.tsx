import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addExtra,
  removeExtra,
  resetShopping,
  setItemState,
  setShopDate,
} from '../data/mutations'
import { useRecipes } from '../data/useRecipes'
import { useWeekMeta } from '../data/useWeekMeta'
import { nextISODate } from '../lib/dates'
import {
  buildShoppingList,
  currentShopWeekSaturday,
  formatShopWindow,
  mealIdsInWindow,
  nextItemState,
  shopWindow,
  type ShoppingItem,
} from '../lib/shopping'
import type { Cook, Extra, Ingredient, ItemState, Meal } from '../types'
import Icon from './Icon'
import IngredientEditor from './IngredientEditor'
import MealTile from './MealTile'
import { StepButtons } from './PlannerToolbar'
import RecipeSheet from './RecipeSheet'
import Sheet from './Sheet'

type ShoppingListProps = {
  /** This week's own Saturday — the week document's id, and the route param. */
  saturdayISO: string
  /** A pane of its own below `md`; a sheet over the week from `md` up. */
  variant: 'sheet' | 'pane'
  cooks: Cook[]
  meals: Meal[]
  ingredients: Ingredient[]
  /** The sheet's close button. The pane is left by the tab bar instead. */
  onClose: () => void
}

const STATE_LABEL: Record<ItemState | 'toGet', string> = {
  toGet: '',
  got: 'Got',
  have: 'Have',
}

/**
 * A week's shopping list: the pane the Shop tab opens on a phone, and the
 * sheet the shop-day marker and the header's bag button open from `md` up. It
 * owns its week's document, so stepping weeks inside it needs nothing from the
 * planner. See PLAN.md §6.
 */
export default function ShoppingList({
  saturdayISO,
  variant,
  cooks,
  meals,
  ingredients,
  onClose,
}: ShoppingListProps) {
  const meta = useWeekMeta(saturdayISO)
  const navigate = useNavigate()

  const ingredientsById = useMemo(
    () => new Map(ingredients.map(i => [i.id, i])),
    [ingredients],
  )

  const shopWin = useMemo(
    () => shopWindow(meta.shopDate, meta.nextShopDate),
    [meta.shopDate, meta.nextShopDate],
  )
  const mealIds = useMemo(() => mealIdsInWindow(cooks, shopWin), [cooks, shopWin])
  const { recipes, loading } = useRecipes(mealIds)

  const list = useMemo(
    () =>
      buildShoppingList({
        window: shopWin,
        cooks,
        meals,
        recipes,
        ingredients,
        shopping: meta.shopping,
        extras: meta.extras,
      }),
    [shopWin, cooks, meals, recipes, ingredients, meta.shopping, meta.extras],
  )

  const [extraName, setExtraName] = useState('')
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null,
  )
  // The list names meals with no ingredients and offers every meal it covers,
  // so it opens recipes itself rather than asking the planner to.
  const [recipeMealId, setRecipeMealId] = useState<string | null>(null)
  const recipeMeal = recipeMealId
    ? (meals.find(meal => meal.id === recipeMealId) ?? null)
    : null

  const sundayISO = nextISODate(saturdayISO)
  const shopOnSunday = meta.shopDate === sundayISO

  // The way back after stepping away, offered only once it is needed — the
  // same shape as the planner header's Today.
  const currentISO = currentShopWeekSaturday()
  const showingCurrent = saturdayISO === currentISO

  const hasTicked =
    Object.keys(meta.shopping).some(id => meta.shopping[id]) ||
    list.extras.some(item => item.state !== 'toGet')

  function handleAddExtra() {
    const name = extraName.trim()
    if (!name) return
    addExtra(saturdayISO, name)
    setExtraName('')
  }

  const subtitle = `${formatShopWindow(shopWin)} · ${list.cookCount} ${list.cookCount === 1 ? 'meal' : 'meals'}`

  const body = (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-[13px]">
        <button
          type="button"
          onClick={() =>
            setShopDate(saturdayISO, shopOnSunday ? saturdayISO : sundayISO)
          }
          className="min-w-0 truncate text-ink-3 hover:text-ink-2"
        >
          {shopOnSunday ? 'Shopping Sunday' : 'Shopping Saturday'} ·{' '}
          <span className="text-accent">
            Move to {shopOnSunday ? 'Saturday' : 'Sunday'}
          </span>
        </button>
        {!showingCurrent && (
          <button
            type="button"
            onClick={() => navigate(`/week/${currentISO}/shop`)}
            className="ml-auto shrink-0 text-accent"
          >
            Current list
          </button>
        )}
      </div>

      {list.meals.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.meals.map(({ meal }) => (
            <button
              key={meal.id}
              type="button"
              onClick={() => setRecipeMealId(meal.id)}
              aria-label={meal.name}
              title={meal.name}
              className="shrink-0"
            >
              <MealTile category={meal.category} size="card" />
            </button>
          ))}
        </div>
      )}

      {!loading && list.missing.length > 0 && (
        <div className="space-y-1">
          <p className="ml-0.5 text-xs text-ink-3">No ingredients yet</p>
          {list.missing.map(meal => (
            <button
              key={meal.id}
              type="button"
              onClick={() => setRecipeMealId(meal.id)}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface-1 p-2 text-left"
            >
              <MealTile category={meal.category} size="card" />
              <span className="min-w-0 flex-1 truncate text-[15px]">
                {meal.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-ink-3">Loading…</p>
      ) : (
        <div className="space-y-4">
          {list.sections.map(section => (
            <div key={section.aisle}>
              <p className="mb-1 ml-0.5 text-xs text-ink-3">{section.label}</p>
              <div className="space-y-1">
                {section.items.map(item => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    onTap={() =>
                      setItemState(
                        saturdayISO,
                        item.id,
                        nextItemState(item.state),
                      )
                    }
                    onHold={() => {
                      const ingredient = ingredientsById.get(item.id)
                      if (ingredient) setEditingIngredient(ingredient)
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
          {list.sections.length === 0 && list.missing.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-3">
              Nothing to shop for this week.
            </p>
          )}
        </div>
      )}

      <div>
        <p className="mb-1 ml-0.5 text-xs text-ink-3">Extras</p>
        <div className="space-y-1">
          {list.extras.map(item => (
            <div key={item.id} className="flex items-center gap-1">
              <div className="min-w-0 flex-1">
                <ShoppingItemRow
                  item={item}
                  onTap={() =>
                    setItemState(
                      saturdayISO,
                      item.id,
                      nextItemState(item.state),
                    )
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const extra: Extra = { id: item.id, name: item.name }
                  removeExtra(saturdayISO, extra)
                }}
                aria-label={`Remove ${item.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-surface-1 hover:text-ink"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-surface-1 px-3">
          <Icon name="plus" className="h-4 w-4 text-ink-3" />
          <input
            type="text"
            placeholder="Add an item"
            value={extraName}
            onChange={e => setExtraName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddExtra()
              }
            }}
            className="h-10 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none md:text-[15px]"
          />
        </div>
      </div>

      {hasTicked && (
        <div className="border-t border-line pt-3">
          {confirmingReset ? (
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 text-[15px] text-danger md:text-sm">
                Reset the list?
              </p>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="text-sm text-ink-3 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetShopping(saturdayISO)
                  setConfirmingReset(false)
                }}
                className="text-sm font-medium text-danger"
              >
                Reset
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="text-[15px] text-danger md:text-sm"
            >
              Reset the list
            </button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {variant === 'pane' ? (
        // The pane scrolls within its own space, as every pane does: the
        // document itself never scrolls. See PLAN.md §6.
        <section aria-label="Shopping list" className="flex h-full flex-col">
          <header className="flex shrink-0 items-center gap-2 px-4 pt-4 pb-1">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-medium">Shopping list</h2>
              <p className="mt-0.5 truncate text-[13px] text-ink-3">
                {subtitle}
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <StepButtons />
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-4">
            {body}
          </div>
        </section>
      ) : (
        <Sheet
          title="Shopping list"
          subtitle={subtitle}
          actions={<StepButtons />}
          onClose={onClose}
        >
          {body}
        </Sheet>
      )}

      {recipeMeal && (
        <RecipeSheet
          meal={recipeMeal}
          ingredients={ingredients}
          onClose={() => setRecipeMealId(null)}
        />
      )}

      {editingIngredient && (
        <IngredientEditor
          ingredient={editingIngredient}
          onClose={() => setEditingIngredient(null)}
        />
      )}
    </>
  )
}

const STATE_ICON: Record<ItemState, 'check' | 'cupboard'> = {
  got: 'check',
  have: 'cupboard',
}

const HOLD_MS = 500

type ShoppingItemRowProps = {
  item: ShoppingItem
  onTap: () => void
  /** Present for ingredient rows only — extras have no aisle to correct. */
  onHold?: () => void
}

/**
 * One row of the list: the whole row cycles `toGet → got → have → toGet` on
 * tap. Done rows dim and strike through in place, never re-sorted — the one
 * thing a list held in a supermarket must not do. Holding a row opens its
 * ingredient's own name and aisle; tapping the picker's pencil is the click
 * equivalent. See PLAN.md §6.
 */
function ShoppingItemRow({ item, onTap, onHold }: ShoppingItemRowProps) {
  const holdTimer = useRef<number | undefined>(undefined)
  const held = useRef(false)

  function startHold() {
    if (!onHold) return
    held.current = false
    holdTimer.current = window.setTimeout(() => {
      held.current = true
      onHold()
    }, HOLD_MS)
  }

  function cancelHold() {
    window.clearTimeout(holdTimer.current)
  }

  const done = item.state !== 'toGet'

  return (
    <button
      type="button"
      onClick={() => {
        if (held.current) {
          held.current = false
          return
        }
        onTap()
      }}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-opacity ${done ? 'opacity-45' : 'hover:bg-surface-1'}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-accent text-on-primary' : 'shadow-[inset_0_0_0_1.5px_var(--color-line-strong)]'
        }`}
      >
        {done && (
          <Icon
            name={STATE_ICON[item.state as ItemState]}
            className="h-3 w-3"
            strokeWidth={2.5}
          />
        )}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-[15px] ${done ? 'line-through' : ''}`}
      >
        {item.name}
      </span>
      {done && (
        <span className="shrink-0 text-[11px] text-ink-3">
          {STATE_LABEL[item.state]}
        </span>
      )}
      {item.amounts.length > 0 && (
        <span className="shrink-0 text-[13px] text-ink-2 tabular-nums">
          {item.amounts.join(' + ')}
        </span>
      )}
    </button>
  )
}
