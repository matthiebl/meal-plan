import { tileClasses } from '../lib/categories'
import type { MealCategory } from '../types'
import Icon from './Icon'

/**
 * Sizes named for where the tile sits, since each carries its own phone and
 * desktop dimensions. Only the larger sizes have room for a secondary badge.
 */
const SIZES = {
  chip: {
    box: 'h-7 w-7 rounded-lg md:h-6 md:w-6 md:rounded-[7px]',
    icon: 'h-4 w-4 md:h-3.5 md:w-3.5',
    badge: false,
  },
  row: { box: 'h-8 w-8 rounded-lg', icon: 'h-4.5 w-4.5', badge: false },
  card: {
    box: 'h-12 w-12 rounded-xl md:h-10 md:w-10 md:rounded-[11px]',
    icon: 'h-6 w-6 md:h-5 md:w-5',
    badge: true,
  },
  header: { box: 'h-10 w-10 rounded-[11px]', icon: 'h-5 w-5', badge: true },
} as const

/**
 * The ring around the badge is the colour of the surface under the tile, so
 * the badge reads as cut out of the tile's corner.
 */
const BADGE_RINGS = {
  'surface-1': 'ring-surface-1',
  'surface-2': 'ring-surface-2',
  'surface-3': 'ring-surface-3',
} as const

type MealTileProps = {
  category: MealCategory | undefined
  size: keyof typeof SIZES
  surface?: keyof typeof BADGE_RINGS
  /** Replaces the secondary badge with a return-arrow, marking a leftovers cook. */
  leftovers?: boolean
  className?: string
}

/**
 * A meal's image: its main category's icon on that category's tint, with the
 * secondary category as a small badge in the corner — or, on a leftovers
 * cook, a return-arrow in its place. Rendered identically wherever the meal
 * appears. See PLAN.md §5.
 */
export default function MealTile({
  category,
  size,
  surface = 'surface-1',
  leftovers = false,
  className = '',
}: MealTileProps) {
  const { box, icon, badge } = SIZES[size]
  const secondary = badge && !leftovers ? category?.secondary : undefined

  return (
    <span
      aria-hidden
      className={`relative flex shrink-0 items-center justify-center ${box} ${tileClasses(category?.main)} ${className}`}
    >
      <Icon name={category?.main ?? 'plate'} className={icon} />
      {secondary && (
        <span
          className={`absolute -right-1 -bottom-1 flex h-[48%] w-[48%] items-center justify-center rounded-full ring-2 ${
            BADGE_RINGS[surface]
          } ${tileClasses(secondary)}`}
        >
          <Icon
            name={secondary}
            className="h-[72%] w-[72%]"
            strokeWidth={2.2}
          />
        </span>
      )}
      {badge && leftovers && (
        <span
          className={`absolute -right-1 -bottom-1 flex h-[48%] w-[48%] items-center justify-center rounded-full bg-surface-2 text-ink-2 ring-2 ${BADGE_RINGS[surface]}`}
        >
          <Icon
            name="leftovers"
            className="h-[70%] w-[70%]"
            strokeWidth={2.2}
          />
        </span>
      )}
    </span>
  )
}
