import { useEffect, useState } from 'react'
import { archiveMeal, addMeal, updateMeal } from '../data/mutations'
import { useIsMobile } from '../lib/responsive'
import type { Meal, MealCategory } from '../types'
import CategoryChips from './CategoryChips'
import CategoryPicker from './CategoryPicker'
import Icon from './Icon'
import MealTile from './MealTile'

type MealDialogProps = {
  /** null creates a new meal; otherwise edits this one. */
  meal: Meal | null
  /** Prefills the name of a new meal — the search that turned nothing up. */
  initialName?: string
  /** Receives the new meal's id, so a caller can plan it straight away. */
  onCreated?: (mealId: string) => void
  onClose: () => void
}

const LABEL = 'mb-1.5 ml-0.5 block text-xs text-ink-3'
const STEP_BUTTON =
  'flex h-10 w-10 items-center justify-center rounded-[11px] bg-surface-1 text-ink-2 hover:text-ink disabled:opacity-40'

/**
 * Creates or edits a meal: name, servings, and category (PLAN.md §5). Save
 * sits in the header row, so it is on screen however far the form scrolls.
 * Below `md` this is a bottom sheet.
 */
export default function MealDialog({ meal, initialName, onCreated, onClose }: MealDialogProps) {
  const [name, setName] = useState(meal?.name ?? initialName ?? '')
  const [servings, setServings] = useState(meal?.servings ?? 4)
  const [category, setCategory] = useState<MealCategory | undefined>(meal?.category)
  const isMobile = useIsMobile()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const canSave = name.trim().length > 0 && servings > 0

  // The dialog closes as soon as the write is issued: Firestore has already
  // applied it locally, so the meal is on screen before the server hears of
  // it. Waiting on the acknowledgement would hold the dialog open. See
  // PLAN.md §6.
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSave) return
    const input = { name: name.trim(), servings, category }
    if (meal) {
      updateMeal(meal.id, input)
    } else {
      // Not `onCreated?.(addMeal(input))`: optional chaining would skip the
      // argument entirely when no callback is passed, and create nothing.
      const mealId = addMeal(input)
      onCreated?.(mealId)
    }
    onClose()
  }

  function handleArchive() {
    if (!meal) return
    archiveMeal(meal.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] md:items-center md:p-4"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={meal ? 'Edit meal' : 'New meal'}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface-2 text-ink shadow-2xl md:max-h-[90vh] md:rounded-2xl"
      >
        <div className="flex-shrink-0 border-b border-line px-4 pt-2.5 pb-3 md:pt-3">
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-line-strong md:hidden" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <button type="button" onClick={onClose} className="justify-self-start py-1 text-sm text-ink-3 hover:text-ink">
              Cancel
            </button>
            <h2 className="text-base font-medium">{meal ? 'Edit meal' : 'New meal'}</h2>
            <button
              type="submit"
              disabled={!canSave}
              className="justify-self-end py-1 text-sm font-medium text-accent disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5">
          <div className="flex items-center gap-3 rounded-2xl bg-surface-1 p-2">
            <MealTile category={category} size="card" />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[15px] font-medium ${name.trim() ? '' : 'text-ink-3'}`}>
                {name.trim() || 'Meal name'}
              </p>
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                <CategoryChips category={category} />
                <span className="truncate text-[13px] text-ink-2">Serves {servings}</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="meal-name" className={LABEL}>
              Name
            </label>
            {/* The one thing here that has to be typed. It is not focused on a
                phone, where the keyboard would cover the rest of the form. */}
            <input
              id="meal-name"
              type="text"
              autoFocus={!meal && !isMobile}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken carbonara"
              className="w-full rounded-xl bg-surface-1 px-3.5 py-2.5 text-base placeholder:text-ink-3"
            />
          </div>

          <div>
            <span className={LABEL}>Servings</span>
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                disabled={servings <= 1}
                aria-label="One fewer serving"
                className={STEP_BUTTON}
              >
                <Icon name="minus" />
              </button>
              <output aria-live="polite" className="min-w-5 text-center text-lg font-medium tabular-nums">
                {servings}
              </output>
              <button
                type="button"
                onClick={() => setServings((s) => s + 1)}
                aria-label="One more serving"
                className={STEP_BUTTON}
              >
                <Icon name="plus" />
              </button>
            </div>
          </div>

          <CategoryPicker value={category} onChange={setCategory} />

          {meal && (
            <div className="border-t border-line pt-1">
              <button
                type="button"
                onClick={handleArchive}
                className="flex w-full items-center gap-3 px-0.5 py-2.5 text-left text-[15px] text-danger md:text-sm"
              >
                <Icon name="archive" />
                Archive meal
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
