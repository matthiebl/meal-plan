import { useMemo, useState } from 'react'
import { addIngredient, updateIngredient } from '../data/mutations'
import {
  AISLE_LABELS,
  aisleOf,
  hasExactName,
  searchIngredients,
} from '../lib/ingredients'
import {
  FALLBACK_UNIT,
  UNIT_FAMILIES,
  familyOf,
  unitLabel,
  unitsInFamily,
} from '../lib/units'
import type { Aisle, Ingredient, RecipeItem, Unit } from '../types'
import AisleChips from './AisleChips'
import Icon from './Icon'
import Sheet from './Sheet'

type Step = 'search' | 'create' | 'amount' | 'editIngredient'

type IngredientPickerProps = {
  ingredients: Ingredient[]
  /** Editing an existing recipe item skips search, opening straight on its amount. */
  editingItem?: RecipeItem
  onSave: (item: RecipeItem) => void
  /** Present only when editing an existing item — its row in the amount step. */
  onRemove?: () => void
  onClose: () => void
}

const LABEL = 'mb-1.5 ml-0.5 block text-xs text-ink-3'
const BACK_BUTTON = 'mb-3 flex items-center gap-1 text-sm text-ink-3 hover:text-ink'

/**
 * One sheet whose body advances through steps — search, create, amount — so
 * a phone never has a sheet stacked on a sheet, which would leave nothing to
 * dismiss to. See PLAN.md §6.
 */
export default function IngredientPicker({
  ingredients,
  editingItem,
  onSave,
  onRemove,
  onClose,
}: IngredientPickerProps) {
  const ingredientsById = useMemo(
    () => new Map(ingredients.map(i => [i.id, i])),
    [ingredients],
  )

  const [step, setStep] = useState<Step>(editingItem ? 'amount' : 'search')
  const [query, setQuery] = useState('')
  const [selectedIngredientId, setSelectedIngredientId] = useState<
    string | null
  >(editingItem?.ingredientId ?? null)
  const [creatingName, setCreatingName] = useState('')
  const [newAisle, setNewAisle] = useState<Aisle | undefined>(undefined)
  const [editingIngredientId, setEditingIngredientId] = useState<
    string | null
  >(null)
  const [editName, setEditName] = useState('')
  const [editAisle, setEditAisle] = useState<Aisle | undefined>(undefined)

  const [amount, setAmount] = useState(
    editingItem ? String(editingItem.amount) : '',
  )
  const [unit, setUnit] = useState<Unit>(
    editingItem?.unit ??
      (selectedIngredientId
        ? (ingredientsById.get(selectedIngredientId)?.defaultUnit ??
          FALLBACK_UNIT)
        : FALLBACK_UNIT),
  )
  const [note, setNote] = useState(editingItem?.note ?? '')

  const results = useMemo(
    () => searchIngredients(ingredients, query),
    [ingredients, query],
  )
  const showCreateRow = !hasExactName(ingredients, query)

  function pickIngredient(ingredient: Ingredient) {
    setSelectedIngredientId(ingredient.id)
    setUnit(ingredient.defaultUnit ?? FALLBACK_UNIT)
    setAmount('')
    setNote('')
    setStep('amount')
  }

  function startCreating() {
    setCreatingName(query.trim())
    setNewAisle(undefined)
    setStep('create')
  }

  function handleCreate() {
    const name = creatingName.trim()
    if (!name) return
    const id = addIngredient({ name, aisle: newAisle, defaultUnit: undefined })
    setSelectedIngredientId(id)
    setUnit(FALLBACK_UNIT)
    setAmount('')
    setNote('')
    setStep('amount')
  }

  function startEditingIngredient(ingredient: Ingredient) {
    setEditingIngredientId(ingredient.id)
    setEditName(ingredient.name)
    setEditAisle(ingredient.aisle)
    setStep('editIngredient')
  }

  function handleSaveIngredientEdit() {
    if (!editingIngredientId || !editName.trim()) return
    updateIngredient(editingIngredientId, {
      name: editName.trim(),
      aisle: editAisle ?? null,
    })
    setStep('search')
  }

  const parsedAmount = unit === 'some' ? 1 : parseFloat(amount)
  const canSaveAmount =
    selectedIngredientId != null &&
    (unit === 'some' || (Number.isFinite(parsedAmount) && parsedAmount > 0))

  function handleSaveAmount() {
    if (!selectedIngredientId || !canSaveAmount) return
    // Recorded so the next time this ingredient is added, nothing needs
    // tapping. See PLAN.md §6.
    updateIngredient(selectedIngredientId, { defaultUnit: unit })
    onSave({
      ingredientId: selectedIngredientId,
      amount: parsedAmount,
      unit,
      note: note.trim() || undefined,
    })
    onClose()
  }

  const selectedIngredient = selectedIngredientId
    ? ingredientsById.get(selectedIngredientId)
    : undefined

  // The selected ingredient's own family's chips come first, so its usual
  // unit is never the last row to scan to.
  const familyOrder = useMemo(() => {
    const preferred = familyOf(unit)
    return [
      ...UNIT_FAMILIES.filter(f => f.id === preferred),
      ...UNIT_FAMILIES.filter(f => f.id !== preferred),
    ]
  }, [unit])

  if (step === 'editIngredient') {
    return (
      <Sheet title="Edit ingredient" onClose={onClose}>
        <button
          type="button"
          onClick={() => setStep('search')}
          className={BACK_BUTTON}
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to search
        </button>
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-ingredient-name" className={LABEL}>
              Name
            </label>
            <input
              id="edit-ingredient-name"
              type="text"
              autoFocus
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full rounded-xl bg-surface-1 px-3.5 py-2.5 text-base placeholder:text-ink-3"
            />
          </div>
          <div>
            <span className={LABEL}>Aisle</span>
            <AisleChips value={editAisle} onChange={setEditAisle} />
          </div>
          <button
            type="button"
            onClick={handleSaveIngredientEdit}
            disabled={!editName.trim()}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-on-primary disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </Sheet>
    )
  }

  if (step === 'create') {
    return (
      <Sheet title={`Create “${creatingName}”`} onClose={onClose}>
        <button
          type="button"
          onClick={() => setStep('search')}
          className={BACK_BUTTON}
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to search
        </button>
        <div className="space-y-4">
          <div>
            <label htmlFor="new-ingredient-name" className={LABEL}>
              Name
            </label>
            <input
              id="new-ingredient-name"
              type="text"
              autoFocus
              value={creatingName}
              onChange={e => setCreatingName(e.target.value)}
              className="w-full rounded-xl bg-surface-1 px-3.5 py-2.5 text-base placeholder:text-ink-3"
            />
          </div>
          <div>
            <span className={LABEL}>Aisle</span>
            <AisleChips value={newAisle} onChange={setNewAisle} />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!creatingName.trim()}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-on-primary disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </Sheet>
    )
  }

  if (step === 'amount') {
    return (
      <Sheet
        title={selectedIngredient?.name ?? 'Amount'}
        onClose={onClose}
      >
        {!editingItem && (
          <button
            type="button"
            onClick={() => setStep('search')}
            className={BACK_BUTTON}
          >
            <Icon name="chevron-left" className="h-4 w-4" />
            Back to search
          </button>
        )}
        <div className="space-y-4">
          {unit !== 'some' && (
            <div>
              <label htmlFor="ingredient-amount" className={LABEL}>
                Amount
              </label>
              {/* inputMode="decimal": a phone shows a number pad, and
                  text-base stops iOS zooming the sheet on focus. */}
              <input
                id="ingredient-amount"
                type="text"
                inputMode="decimal"
                autoFocus
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl bg-surface-1 px-3.5 py-2.5 text-base placeholder:text-ink-3"
              />
            </div>
          )}
          <div>
            <span className={LABEL}>Unit</span>
            <div className="space-y-2.5">
              {familyOrder.map(family => (
                <div
                  key={family.id}
                  role="group"
                  aria-label={family.label}
                  className="flex flex-wrap gap-1.5"
                >
                  {unitsInFamily(family.id).map(u => {
                    const selected = unit === u
                    return (
                      <button
                        key={u}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setUnit(u)}
                        className={`flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors ${
                          selected
                            ? 'bg-primary text-on-primary shadow-[inset_0_0_0_1.5px_currentColor]'
                            : 'bg-surface-1 text-ink-2 hover:text-ink'
                        }`}
                      >
                        {unitLabel(u)}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="ingredient-note" className={LABEL}>
              Note
            </label>
            <input
              id="ingredient-note"
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. minced"
              className="w-full rounded-xl bg-surface-1 px-3.5 py-2.5 text-base placeholder:text-ink-3"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveAmount}
            disabled={!canSaveAmount}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-on-primary disabled:opacity-40"
          >
            Save
          </button>
          {editingItem && onRemove && (
            <div className="border-t border-line pt-1">
              <button
                type="button"
                onClick={() => {
                  onRemove()
                  onClose()
                }}
                className="flex w-full items-center gap-3 px-0.5 py-2.5 text-left text-[15px] text-danger md:text-sm"
              >
                <Icon name="trash" />
                Remove ingredient
              </button>
            </div>
          )}
        </div>
      </Sheet>
    )
  }

  // step === 'search'
  return (
    <Sheet title="Add ingredient" onClose={onClose}>
      {/* Not focused on a phone: the library is a list to point at, and a
          keyboard sliding up over it is the opposite of the gesture. */}
      <label className="mb-2.5 flex items-center gap-2 rounded-xl bg-surface-1 px-3 text-ink-3 focus-within:outline-2 focus-within:outline-accent">
        <Icon name="search" className="h-4.5 w-4.5" />
        <input
          type="search"
          placeholder="Search ingredients"
          aria-label="Search ingredients"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key !== 'Enter') return
            if (results.length > 0) pickIngredient(results[0])
            else if (query.trim() && showCreateRow) startCreating()
          }}
          className="h-10 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none md:text-[15px]"
        />
      </label>
      <div className="max-h-[55dvh] space-y-2 overflow-y-auto md:max-h-[26rem]">
        {results.length === 0 && (
          <p className="px-1 py-2 text-center text-sm text-ink-3">
            {ingredients.length === 0
              ? 'No ingredients yet.'
              : 'No ingredients match.'}
          </p>
        )}
        {results.map(ingredient => (
          <div
            key={ingredient.id}
            className="flex items-center gap-1 rounded-2xl bg-surface-1 pr-1"
          >
            <button
              type="button"
              onClick={() => pickIngredient(ingredient)}
              className="min-w-0 flex-1 truncate px-3.5 py-3 text-left text-[15px]"
            >
              {ingredient.name}
              <span className="ml-2 text-[13px] text-ink-3">
                {AISLE_LABELS[aisleOf(ingredient)]}
              </span>
            </button>
            <button
              type="button"
              onClick={() => startEditingIngredient(ingredient)}
              aria-label={`Edit ${ingredient.name}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-line hover:text-ink"
            >
              <Icon name="pencil" className="h-4.5 w-4.5" />
            </button>
          </div>
        ))}
        {showCreateRow && (
          <button
            type="button"
            onClick={startCreating}
            className="flex w-full items-center gap-2.5 rounded-2xl border border-dashed border-line-strong p-3.5 text-left text-sm text-ink-3 hover:text-ink-2"
          >
            <Icon name="plus" className="h-4.5 w-4.5" />
            <span className="truncate">
              {query.trim() ? `Create “${query.trim()}”` : 'New ingredient'}
            </span>
          </button>
        )}
      </div>
    </Sheet>
  )
}
