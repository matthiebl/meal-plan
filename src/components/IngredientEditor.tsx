import { useState } from 'react'
import { updateIngredient } from '../data/mutations'
import type { Ingredient } from '../types'
import AisleChips from './AisleChips'
import Sheet from './Sheet'

const LABEL = 'mb-1.5 ml-0.5 block text-xs text-ink-3'

type IngredientEditorProps = {
  ingredient: Ingredient
  onClose: () => void
}

/**
 * An ingredient's own name and aisle — reached from a pencil in the picker's
 * search results, and (on the shopping list) by holding an item. Renaming an
 * ingredient renames it everywhere it is used. See PLAN.md §3 and §6.
 */
export default function IngredientEditor({
  ingredient,
  onClose,
}: IngredientEditorProps) {
  const [name, setName] = useState(ingredient.name)
  const [aisle, setAisle] = useState(ingredient.aisle)

  const canSave = name.trim().length > 0

  function handleSave() {
    if (!canSave) return
    updateIngredient(ingredient.id, {
      name: name.trim(),
      aisle: aisle ?? null,
    })
    onClose()
  }

  return (
    <Sheet title="Edit ingredient" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label htmlFor="ingredient-name" className={LABEL}>
            Name
          </label>
          <input
            id="ingredient-name"
            type="text"
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl bg-surface-1 px-3.5 py-2.5 text-base placeholder:text-ink-3"
          />
        </div>
        <div>
          <span className={LABEL}>Aisle</span>
          <AisleChips value={aisle} onChange={setAisle} />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-on-primary disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </Sheet>
  )
}
