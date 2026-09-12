import { useEffect, useState } from 'react'
import { archiveMeal, addMeal, updateMeal } from '../data/mutations'
import { chipClasses } from '../lib/visuals'
import type { Meal, MealVisual } from '../types'
import VisualPicker from './VisualPicker'

type MealDialogProps = {
  /** null creates a new meal; otherwise edits this one. */
  meal: Meal | null
  /** Prefills the name of a new meal — the search that turned nothing up. */
  initialName?: string
  /** Receives the new meal's id, so a caller can plan it straight away. */
  onCreated?: (mealId: string) => void
  onClose: () => void
}

const DEFAULT_VISUAL: MealVisual = { color: 'slate', fill: 'soft' }

/** Creates or edits a meal: name, servings, and the three visual dimensions from PLAN.md §5. */
export default function MealDialog({ meal, initialName, onCreated, onClose }: MealDialogProps) {
  const [name, setName] = useState(meal?.name ?? initialName ?? '')
  const [servings, setServings] = useState(meal?.servings ?? 4)
  const [visual, setVisual] = useState<MealVisual>(meal?.visual ?? DEFAULT_VISUAL)

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
    const input = { name: name.trim(), servings, visual }
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={meal ? 'Edit meal' : 'New meal'}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
      >
        <h2 className="text-xl font-semibold">{meal ? 'Edit meal' : 'New meal'}</h2>

        <div className="mt-5 flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
          <span
            className={`inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-base font-semibold ${chipClasses(
              visual,
            )}`}
          >
            {visual.icon && <span className="text-xl leading-none">{visual.icon}</span>}
            <span className="truncate">{name.trim() || 'Meal name'}</span>
          </span>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="meal-name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              id="meal-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken katsu curry"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div>
            <label htmlFor="meal-servings" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Servings
            </label>
            <div className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                aria-label="One fewer serving"
                className="h-11 w-11 rounded-l-lg text-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                −
              </button>
              <input
                id="meal-servings"
                type="number"
                min={1}
                value={servings}
                onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
                className="h-11 w-14 border-x border-gray-300 bg-transparent text-center text-base font-medium tabular-nums [appearance:textfield] dark:border-gray-700 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setServings((s) => s + 1)}
                aria-label="One more serving"
                className="h-11 w-11 rounded-r-lg text-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                +
              </button>
            </div>
          </div>

          <VisualPicker value={visual} onChange={setVisual} />
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          {meal ? (
            <button
              type="button"
              onClick={handleArchive}
              className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Archive
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-gray-900"
            >
              {meal ? 'Save' : 'Add meal'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
