import type { DragData } from '../lib/dnd'
import { LEFTOVERS_PREFIX, chipClasses } from '../lib/visuals'

type DragOverlayChipProps = {
  data: DragData
}

/** The floating chip rendered under the pointer for any of the four drag gestures. See PLAN.md §6. */
export default function DragOverlayChip({ data }: DragOverlayChipProps) {
  const isLeftovers = data.type === 'leftovers' || (data.type === 'cook' && data.cook.kind === 'leftovers')

  return (
    <div
      className={`flex h-10 max-w-[20rem] cursor-grabbing items-center gap-1.5 px-3.5 text-sm font-semibold shadow-2xl ${chipClasses(
        data.meal.visual,
      )} ${
        isLeftovers
          ? 'rounded-r-full rounded-l-md border-l-[3px] border-current opacity-90 [border-left-style:dashed]'
          : 'rounded-full'
      }`}
    >
      {isLeftovers && <span className="flex-shrink-0 leading-none opacity-80">{LEFTOVERS_PREFIX}</span>}
      {data.meal.visual.icon && (
        <span className="flex-shrink-0 text-base leading-none">{data.meal.visual.icon}</span>
      )}
      <span className="truncate">{data.meal.name}</span>
    </div>
  )
}
