import type { DragData } from '../lib/dnd'
import Icon from './Icon'
import MealTile from './MealTile'

type DragOverlayChipProps = {
  data: DragData
}

/** The floating chip rendered under the pointer for any of the four drag gestures. See PLAN.md §6. */
export default function DragOverlayChip({ data }: DragOverlayChipProps) {
  const isLeftovers = data.type === 'leftovers' || (data.type === 'cook' && data.cook.kind === 'leftovers')

  return (
    <div className="flex h-10 max-w-[20rem] cursor-grabbing items-center gap-2 rounded-xl bg-surface-3 p-1.25 pr-3.5 text-sm text-ink shadow-xl ring-1 ring-line">
      <MealTile category={data.meal.category} size="chip" surface="surface-3" className={isLeftovers ? 'opacity-70' : ''} />
      {isLeftovers && <Icon name="leftovers" className="-mr-1 h-3.5 w-3.5 text-ink-2" strokeWidth={2} />}
      <span className="truncate">{data.meal.name}</span>
    </div>
  )
}
