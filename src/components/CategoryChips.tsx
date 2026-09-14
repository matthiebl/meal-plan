import { CATEGORY_LABELS, tileClasses } from '../lib/categories'
import type { MealCategory } from '../types'

/**
 * A meal's categories as small named chips. The tile's icons alone do not
 * say "lamb" or "pork" reliably, so the names sit beside them. See PLAN.md §5.
 */
export default function CategoryChips({
  category,
}: {
  category: MealCategory | undefined
}) {
  if (!category) return null
  const ids = category.secondary
    ? [category.main, category.secondary]
    : [category.main]

  return (
    <span className="flex shrink-0 items-center gap-1">
      {ids.map(id => (
        <span
          key={id}
          className={`rounded-full px-1.5 text-[11px] leading-4.5 font-medium ${tileClasses(id)}`}
        >
          {CATEGORY_LABELS[id]}
        </span>
      ))}
    </span>
  )
}
