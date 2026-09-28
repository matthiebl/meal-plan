import { useRecipe } from '../data/useRecipes'
import { MENU_ROW } from '../lib/menuStyles'
import Icon from './Icon'

type IngredientsMenuRowProps = {
  mealId: string
  onClick: () => void
  className?: string
}

/**
 * The `Ingredients · n` / `Add ingredients` row in a meal's menus, counted
 * from its own recipe — never denormalized onto the meal. Subscribes only
 * while the menu it sits in is open, since a popover's children are not
 * mounted until then. See PLAN.md §6 and §10.
 */
export default function IngredientsMenuRow({
  mealId,
  onClick,
  className = '',
}: IngredientsMenuRowProps) {
  const { recipe } = useRecipe(mealId)
  const count = recipe?.items.length ?? 0
  return (
    <button type="button" onClick={onClick} className={`${MENU_ROW} ${className}`}>
      <Icon name="ingredients" className="h-5 w-5 text-ink-3" />
      {count > 0 ? `Ingredients · ${count}` : 'Add ingredients'}
    </button>
  )
}
