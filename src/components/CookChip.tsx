import { chipClasses } from '../lib/visuals'
import type { Cook, Meal } from '../types'

type CookChipProps = {
  cook: Cook
  meal: Meal
  onDelete: () => void
}

/**
 * One cook or leftovers chip, styled identically wherever the meal appears.
 * Leftovers styling is derived from `kind`, never chosen: a dashed left
 * edge, a ↩ prefix, and reduced opacity. See PLAN.md §5.
 */
export default function CookChip({ cook, meal, onDelete }: CookChipProps) {
  const isLeftovers = cook.kind === 'leftovers'

  return (
    <div
      className={`flex items-center gap-1 py-1 pr-1 pl-2.5 text-xs font-medium ${chipClasses(meal.visual)} ${
        isLeftovers
          ? 'rounded-r-full border-l-2 border-current opacity-75 [border-left-style:dashed]'
          : 'rounded-full'
      }`}
    >
      <span className="truncate">
        {isLeftovers ? '↩ ' : ''}
        {meal.visual.icon ? `${meal.visual.icon} ` : ''}
        {meal.name}
      </span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Remove ${meal.name} from this day`}
        className="flex-shrink-0 rounded-full px-1 text-current opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}
