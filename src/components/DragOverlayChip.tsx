import type { DragData } from '../lib/dnd'
import MealTile from './MealTile'

type DragOverlayChipProps = {
  data: DragData
}

/** The floating chip rendered under the pointer for any of the four drag gestures. See PLAN.md §6. */
export default function DragOverlayChip({ data }: DragOverlayChipProps) {
  const isLeftovers =
    data.type === 'leftovers' ||
    (data.type === 'cook' && data.cook.kind === 'leftovers')

  return (
    <div className="flex w-92 cursor-grabbing items-center gap-3 rounded-2xl bg-surface-3 p-2 pr-4 text-ink shadow-xl ring-1 ring-line">
      <MealTile
        category={data.meal.category}
        size="card"
        surface="surface-3"
        leftovers={isLeftovers}
        className={isLeftovers ? 'opacity-70' : ''}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">
          {data.meal.name}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-ink-2">
          {isLeftovers ? 'Leftovers' : `Serves ${data.meal.servings}`}
        </span>
      </span>
    </div>
  )
}
