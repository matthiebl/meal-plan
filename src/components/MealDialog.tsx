import { useEffect, useState } from 'react'
import { archiveMeal, addMeal, updateMeal } from '../data/mutations'
import type { Meal, MealVisual } from '../types'
import VisualPicker from './VisualPicker'

type MealDialogProps = {
  /** null creates a new meal; otherwise edits this one. */
  meal: Meal | null
  onClose: () => void
}

const DEFAULT_VISUAL: MealVisual = { color: 'slate', fill: 'soft' }

/** Creates or edits a meal: name, servings, and the three visual dimensions from PLAN.md §5. */
export default function MealDialog({ meal, onClose }: MealDialogProps) {
  const [name, setName] = useState(meal?.name ?? '')
  const [servings, setServings] = useState(meal?.servings ?? 4)
  const [visual, setVisual] = useState<MealVisual>(meal?.visual ?? DEFAULT_VISUAL)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const canSave = name.trim().length > 0 && servings > 0

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      const input = { name: name.trim(), servings, visual }
      if (meal) {
        await updateMeal(meal.id, input)
      } else {
        await addMeal(input)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!meal) return
    setSaving(true)
    try {
      await archiveMeal(meal.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={meal ? 'Edit meal' : 'New meal'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900"
      >
        <h2 className="mb-4 text-lg font-semibold">{meal ? 'Edit meal' : 'New meal'}</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="meal-name" className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Name
            </label>
            <input
              id="meal-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div>
            <label htmlFor="meal-servings" className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Servings
            </label>
            <input
              id="meal-servings"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <VisualPicker value={visual} onChange={setVisual} />
        </div>

        <div className="mt-6 flex items-center justify-between">
          {meal ? (
            <button
              type="button"
              onClick={handleArchive}
              disabled={saving}
              className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
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
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
