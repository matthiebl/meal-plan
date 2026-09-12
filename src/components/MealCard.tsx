import { chipClasses } from '../lib/visuals'
import type { Meal, MealStats } from '../types'

type MealCardProps = {
  meal: Meal
  stats: MealStats
  onEdit: () => void
}

/** One meal in the library: its visual, servings, and the §4 derived statistics. */
export default function MealCard({ meal, stats, onEdit }: MealCardProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`truncate rounded-full px-2.5 py-1 text-sm font-medium ${chipClasses(meal.visual)}`}>
          {meal.visual.icon ? `${meal.visual.icon} ` : ''}
          {meal.name}
        </span>
        <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-600">
          {meal.servings} servings
        </span>
      </div>

      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        <div>
          <dt className="inline text-gray-400 dark:text-gray-600">Last eaten: </dt>
          <dd className="inline">
            {stats.lastEaten ? `${stats.lastEaten} (${stats.daysSince}d ago)` : 'never'}
          </dd>
        </div>
        <div>
          <dt className="inline text-gray-400 dark:text-gray-600">Times cooked: </dt>
          <dd className="inline">{stats.timesCooked}</dd>
        </div>
        {stats.nextPlanned && (
          <div>
            <dt className="inline text-gray-400 dark:text-gray-600">Next: </dt>
            <dd className="inline">{stats.nextPlanned}</dd>
          </div>
        )}
      </dl>
    </button>
  )
}
