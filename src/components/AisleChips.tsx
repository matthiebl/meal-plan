import { AISLES } from '../lib/ingredients'
import type { Aisle } from '../types'

type AisleChipsProps = {
  value: Aisle | undefined
  onChange: (aisle: Aisle) => void
}

/** The closed aisle set as a wrapped chip row — tapped, never typed. See PLAN.md §3. */
export default function AisleChips({ value, onChange }: AisleChipsProps) {
  return (
    <div role="group" aria-label="Aisle" className="flex flex-wrap gap-1.5">
      {AISLES.map(({ id, label }) => {
        const selected = value ? value === id : id === 'other'
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(id)}
            className={`flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors ${
              selected
                ? 'bg-primary text-on-primary shadow-[inset_0_0_0_1.5px_currentColor]'
                : 'bg-surface-1 text-ink-2 hover:text-ink'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
