import { COLOR_TOKENS, FILLS, chipClasses, swatchClasses } from '../lib/visuals'
import type { MealVisual } from '../types'

type VisualPickerProps = {
  value: MealVisual
  onChange: (visual: MealVisual) => void
}

const FILL_LABELS = { solid: 'Solid', soft: 'Soft', outline: 'Outline' } as const

// A closed set, picked rather than typed: reaching an emoji keyboard on a
// phone to fill in a one-character field is the worst interaction in the app.
const ICONS = [
  '🍝', '🍜', '🍕', '🌮', '🍔', '🍗', '🥘', '🍛', '🍣', '🥗',
  '🍳', '🥪', '🌯', '🍤', '🥩', '🍚', '🍲', '🥟', '🐟', '🥦',
  '🌶️', '🧀', '🥙', '🫓', '🍞', '🥓', '🍖', '🦐', '🦀', '🍠',
  '🥔', '🍄', '🫘', '🥬', '🍅', '🌽', '🥕', '🍆', '🥞', '🍱',
]

const LABEL = 'mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
const RING = 'ring-2 ring-gray-900 ring-offset-2 ring-offset-white dark:ring-gray-100 dark:ring-offset-gray-900'

/** Picks a meal's colour, fill, and optional icon from the closed sets in PLAN.md §5. */
export default function VisualPicker({ value, onChange }: VisualPickerProps) {
  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <span className={LABEL}>Colour</span>
        <div className="grid grid-cols-5 justify-items-center gap-2 md:flex md:flex-wrap md:justify-items-start md:gap-2.5">
          {COLOR_TOKENS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={value.color === color}
              title={color}
              onClick={() => onChange({ ...value, color })}
              className={`h-10 w-10 rounded-full transition-transform hover:scale-110 md:h-9 md:w-9 ${swatchClasses(color)} ${
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
        <span className={LABEL}>
          Icon <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </span>
        <div className="grid grid-cols-8 gap-1 md:grid-cols-10">
          <button
            type="button"
            aria-label="No icon"
            aria-pressed={!value.icon}
            onClick={() => onChange({ ...value, icon: undefined })}
            className={`flex h-10 items-center justify-center rounded-lg text-xs text-gray-400 transition-colors hover:bg-gray-100 md:h-9 dark:text-gray-500 dark:hover:bg-gray-800 ${
              !value.icon ? 'bg-gray-100 ring-1 ring-gray-900 dark:bg-gray-800 dark:ring-gray-100' : ''
            }`}
          >
            None
          </button>
          {ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              aria-label={`Use ${icon}`}
              aria-pressed={value.icon === icon}
              onClick={() => onChange({ ...value, icon: value.icon === icon ? undefined : icon })}
              className={`flex h-10 items-center justify-center rounded-lg text-xl transition-colors hover:bg-gray-100 md:h-9 dark:hover:bg-gray-800 ${
                value.icon === icon ? 'bg-gray-100 ring-1 ring-gray-900 dark:bg-gray-800 dark:ring-gray-100' : ''
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
