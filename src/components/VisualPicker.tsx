import { COLOR_TOKENS, FILLS, chipClasses, swatchClasses } from '../lib/visuals'
import type { MealVisual } from '../types'

type VisualPickerProps = {
  value: MealVisual
  onChange: (visual: MealVisual) => void
}

const FILL_LABELS = { solid: 'Solid', soft: 'Soft', outline: 'Outline' } as const

/** Picks a meal's colour, fill, and optional icon from the closed sets in PLAN.md §5. */
export default function VisualPicker({ value, onChange }: VisualPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <span className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
          Colour
        </span>
        <div className="flex flex-wrap gap-2">
          {COLOR_TOKENS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={value.color === color}
              onClick={() => onChange({ ...value, color })}
              className={`h-8 w-8 rounded-full ${swatchClasses(color)} ${
                value.color === color
                  ? 'ring-2 ring-gray-900 ring-offset-2 ring-offset-white dark:ring-gray-100 dark:ring-offset-gray-900'
                  : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
          Fill
        </span>
        <div className="flex gap-2">
          {FILLS.map((fill) => (
            <button
              key={fill}
              type="button"
              aria-pressed={value.fill === fill}
              onClick={() => onChange({ ...value, fill })}
              className={`rounded-full px-3 py-1 text-sm ${chipClasses({ ...value, fill })} ${
                value.fill === fill
                  ? 'ring-2 ring-gray-900 ring-offset-2 ring-offset-white dark:ring-gray-100 dark:ring-offset-gray-900'
                  : ''
              }`}
            >
              {FILL_LABELS[fill]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="meal-icon"
          className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400"
        >
          Icon (optional emoji)
        </label>
        <input
          id="meal-icon"
          type="text"
          maxLength={4}
          value={value.icon ?? ''}
          onChange={(e) => onChange({ ...value, icon: e.target.value || undefined })}
          className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center text-lg dark:border-gray-700 dark:bg-gray-800"
        />
      </div>
    </div>
  )
}
