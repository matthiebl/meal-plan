import { COLOR_TOKENS, FILLS, chipClasses, swatchClasses } from '../lib/visuals'
import type { MealVisual } from '../types'

type VisualPickerProps = {
  value: MealVisual
  onChange: (visual: MealVisual) => void
}

const FILL_LABELS = { solid: 'Solid', soft: 'Soft', outline: 'Outline' } as const

// Enough of the food emoji to cover most of a library without hunting
// through an emoji keyboard. The field still takes anything typed into it.
const SUGGESTED_ICONS = [
  '🍝', '🍜', '🍕', '🌮', '🍔', '🍗', '🥘', '🍛', '🍣', '🥗',
  '🍳', '🥪', '🌯', '🍤', '🥩', '🍚', '🍲', '🥟', '🐟', '🥦',
]

const LABEL = 'mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
const RING = 'ring-2 ring-gray-900 ring-offset-2 ring-offset-white dark:ring-gray-100 dark:ring-offset-gray-900'

/** Picks a meal's colour, fill, and optional icon from the closed sets in PLAN.md §5. */
export default function VisualPicker({ value, onChange }: VisualPickerProps) {
  return (
    <div className="space-y-5">
      <div>
        <span className={LABEL}>Colour</span>
        <div className="flex flex-wrap gap-2.5">
          {COLOR_TOKENS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={value.color === color}
              title={color}
              onClick={() => onChange({ ...value, color })}
              className={`h-9 w-9 rounded-full transition-transform hover:scale-110 ${swatchClasses(color)} ${
                value.color === color ? RING : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <span className={LABEL}>Fill</span>
        <div className="flex gap-2">
          {FILLS.map((fill) => (
            <button
              key={fill}
              type="button"
              aria-pressed={value.fill === fill}
              onClick={() => onChange({ ...value, fill })}
              className={`rounded-full px-4 py-2 text-sm font-medium ${chipClasses({ ...value, fill })} ${
                value.fill === fill ? RING : ''
              }`}
            >
              {FILL_LABELS[fill]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="meal-icon" className={LABEL}>
          Icon <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              id="meal-icon"
              type="text"
              maxLength={4}
              value={value.icon ?? ''}
              placeholder="🍽"
              onChange={(e) => onChange({ ...value, icon: e.target.value || undefined })}
              className="h-12 w-14 flex-shrink-0 rounded-lg border border-gray-300 text-center text-2xl dark:border-gray-700 dark:bg-gray-800"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Type any emoji, or pick one below.
            </p>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {SUGGESTED_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                aria-label={`Use ${icon}`}
                aria-pressed={value.icon === icon}
                onClick={() => onChange({ ...value, icon: value.icon === icon ? undefined : icon })}
                className={`flex h-9 items-center justify-center rounded-lg text-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  value.icon === icon ? 'bg-gray-100 ring-1 ring-gray-900 dark:bg-gray-800 dark:ring-gray-100' : ''
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
