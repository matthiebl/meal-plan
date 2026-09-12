import type { DragData } from '../lib/dnd'
import { chipClasses } from '../lib/visuals'

type DragOverlayChipProps = {
  data: DragData
}

/** The floating chip rendered under the pointer for any of the four drag gestures. See PLAN.md §6. */
export default function DragOverlayChip({ data }: DragOverlayChipProps) {
  if (data.type === 'meal') {
    return (
      <div
        className={`cursor-grabbing truncate rounded-full px-2.5 py-1 text-sm font-medium shadow-lg ${chipClasses(
          data.meal.visual,
        )}`}
      >
        {data.meal.visual.icon ? `${data.meal.visual.icon} ` : ''}
        {data.meal.name}
      </div>
    )
  }

  const isLeftovers = data.type === 'leftovers' || data.cook.kind === 'leftovers'

  return (
    <div
      className={`flex cursor-grabbing items-center gap-1 py-1 pr-2 pl-2.5 text-xs font-medium shadow-lg ${chipClasses(
        data.meal.visual,
      )} ${
        isLeftovers
          ? 'rounded-r-full border-l-2 border-current opacity-75 [border-left-style:dashed]'
          : 'rounded-full'
      }`}
    >
      {isLeftovers ? '↩ ' : ''}
      {data.meal.visual.icon ? `${data.meal.visual.icon} ` : ''}
      {data.meal.name}
    </div>
  )
}
