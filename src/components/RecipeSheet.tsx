import { useMemo, useState } from 'react'
import { useRecipe } from '../data/useRecipes'
import { setRecipeItems } from '../data/mutations'
import { formatAmount } from '../lib/units'
import type { Ingredient, Meal, RecipeItem } from '../types'
import Icon from './Icon'
import IngredientPicker from './IngredientPicker'
import MealTile from './MealTile'
import Sheet from './Sheet'

type RecipeSheetProps = {
  meal: Meal
  ingredients: Ingredient[]
  onClose: () => void
}

/**
 * A meal's ingredients: amount and unit at the left, the ingredient's name as
 * the row's subject, and its note in secondary text after it. There is no
 * Save button — every addition, edit and removal writes immediately, as
 * everything in the planner does. See PLAN.md §6.
 */
export default function RecipeSheet({
  meal,
  ingredients,
  onClose,
}: RecipeSheetProps) {
  const { recipe } = useRecipe(meal.id)
  const items = recipe?.items ?? []
  const ingredientsById = useMemo(
    () => new Map(ingredients.map(i => [i.id, i])),
    [ingredients],
  )

  const [pickerState, setPickerState] = useState<{
    open: boolean
    index: number | null
  }>({ open: false, index: null })

  function handleSaveItem(item: RecipeItem) {
    const next = [...items]
    if (pickerState.index === null) {
      next.push(item)
    } else {
      next[pickerState.index] = item
    }
    setRecipeItems(meal.id, next)
  }

  function handleRemoveItem() {
    if (pickerState.index === null) return
    setRecipeItems(
      meal.id,
      items.filter((_, i) => i !== pickerState.index),
    )
  }

  return (
    <>
      <Sheet
        lead={
          <MealTile category={meal.category} size="header" surface="surface-3" />
        }
        title={meal.name}
        subtitle={`Serves ${meal.servings}`}
        onClose={onClose}
      >
        <div className="space-y-1">
          {items.map((item, index) => {
            const ingredient = ingredientsById.get(item.ingredientId)
            return (
              <button
                key={index}
                type="button"
                onClick={() => setPickerState({ open: true, index })}
                className="flex w-full min-h-11 items-center gap-3 rounded-2xl px-1 py-2.5 text-left hover:bg-surface-1"
              >
                <span className="w-20 shrink-0 text-right text-[13px] text-ink-2 tabular-nums">
                  {formatAmount(item.amount, item.unit)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px]">
                  {ingredient?.name ?? '…'}
                  {item.note && (
                    <span className="text-ink-3"> · {item.note}</span>
                  )}
                </span>
              </button>
            )
          })}
          {items.length === 0 && (
            <p className="px-1 py-3 text-sm text-ink-3">
              No ingredients yet.
            </p>
          )}
          <button
            type="button"
            onClick={() => setPickerState({ open: true, index: null })}
            className="flex w-full items-center gap-2.5 rounded-2xl border border-dashed border-line-strong p-3.5 text-left text-sm text-ink-3 hover:text-ink-2"
          >
            <Icon name="plus" className="h-4.5 w-4.5" />
            Add ingredient
          </button>
        </div>
      </Sheet>

      {pickerState.open && (
        <IngredientPicker
          ingredients={ingredients}
          editingItem={
            pickerState.index !== null ? items[pickerState.index] : undefined
          }
          onSave={handleSaveItem}
          onRemove={pickerState.index !== null ? handleRemoveItem : undefined}
          onClose={() => setPickerState({ open: false, index: null })}
        />
      )}
    </>
  )
}
