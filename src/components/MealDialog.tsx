import { useEffect, useState } from 'react'
import { archiveMeal, addMeal, updateMeal } from '../data/mutations'
import { useIsMobile } from '../lib/responsive'
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center md:p-4"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={meal ? 'Edit meal' : 'New meal'}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl md:max-h-[90vh] md:rounded-2xl md:p-6 dark:bg-gray-900"
      >
        <h2 className="text-lg font-semibold md:text-xl">{meal ? 'Edit meal' : 'New meal'}</h2>

        <div className="mt-4 flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 md:mt-5 md:p-5 dark:border-gray-700 dark:bg-gray-800/50">
          <span
            className={`inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-base font-semibold ${chipClasses(
              visual,
            )}`}
          >
            {visual.icon && <span className="text-xl leading-none">{visual.icon}</span>}
            <span className="truncate">{name.trim() || 'Meal name'}</span>
          </span>
        </div>

        <div className="mt-4 space-y-4 md:mt-5 md:space-y-5">
          <div>
            <label htmlFor="meal-name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              placeholder="e.g. Chicken katsu curry"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Servings</span>
            <div className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                aria-label="One fewer serving"
                className="h-11 w-11 rounded-l-lg text-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                −
              </button>
              <output
                aria-live="polite"
                className="flex h-11 w-14 items-center justify-center border-x border-gray-300 text-base font-medium tabular-nums dark:border-gray-700"
              >
                {servings}
              </output>
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

        {/* Pinned on a phone, where the form is longer than the sheet: Save is
            the reason the sheet is open and should never need scrolling to. */}
        <div className="sticky bottom-[calc(-1.25rem-env(safe-area-inset-bottom))] -mx-4 mt-6 flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 md:static md:m-0 md:mt-7 md:border-0 md:p-0 dark:border-gray-800 dark:bg-gray-900">
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
