import { CATEGORIES, tileClasses, type CategoryGroup } from '../lib/categories'
import type { Category, MealCategory } from '../types'
import Icon from './Icon'

type CategoryPickerProps = {
  value: MealCategory | undefined
  onChange: (category: MealCategory | undefined) => void
}

const LABEL = 'mb-1.5 ml-0.5 block text-xs text-ink-3'
const GROUP_LABELS: Record<CategoryGroup, string> = { protein: 'Protein', carb: 'Carb' }

/**
 * Picks a meal's main and secondary category from the closed set in PLAN.md
 * §5. The main category is a grid of tiles, since it becomes the meal's tile;
 * the secondary is a row of chips, since that is how it appears on the card.
 */
export default function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  function pickMain(id: Category) {
    // Tapping the chosen tile again clears it, and a secondary cannot outlive
    // its main — nor equal it.
    if (value?.main === id) return onChange(undefined)
    const secondary = value?.secondary === id ? undefined : value?.secondary
    onChange(secondary ? { main: id, secondary } : { main: id })
  }

  function pickSecondary(id: Category | undefined) {
    if (!value) return
    onChange(id ? { main: value.main, secondary: id } : { main: value.main })
  }

  return (
    <div className="space-y-4">
      <div>
        <span className={LABEL}>Main</span>
        <div className="space-y-2">
          {(['protein', 'carb'] as const).map((group) => (
            <div key={group} role="group" aria-label={GROUP_LABELS[group]}>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                {CATEGORIES.filter((c) => c.group === group).map(({ id, label }) => {
                  const selected = value?.main === id
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => pickMain(id)}
                      className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                        selected
                          ? `${tileClasses(id)} shadow-[inset_0_0_0_1.5px_currentColor]`
                          : 'bg-surface-1 text-ink-2 hover:text-ink'
                      }`}
                    >
                      <Icon name={id} className="h-5.5 w-5.5" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className={LABEL}>Served with</span>
        {value ? (
          <div className="flex flex-wrap gap-1.5">
            <SecondaryChip label="Nothing" selected={!value.secondary} onClick={() => pickSecondary(undefined)} />
            {CATEGORIES.filter((c) => c.id !== value.main).map(({ id, label }) => (
              <SecondaryChip
                key={id}
                id={id}
                label={label}
                selected={value.secondary === id}
                onClick={() => pickSecondary(id)}
              />
            ))}
          </div>
        ) : (
          <p className="ml-0.5 text-sm text-ink-3">Pick a main first.</p>
        )}
      </div>
    </div>
  )
}

type SecondaryChipProps = { id?: Category; label: string; selected: boolean; onClick: () => void }

function SecondaryChip({ id, label, selected, onClick }: SecondaryChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
        selected
          ? `${id ? tileClasses(id) : 'bg-primary text-on-primary'} shadow-[inset_0_0_0_1.5px_currentColor]`
          : 'bg-surface-1 text-ink-2 hover:text-ink'
      } ${id ? 'pl-2' : ''}`}
    >
      {id && <Icon name={id} className="h-4 w-4" />}
      {label}
    </button>
  )
}
