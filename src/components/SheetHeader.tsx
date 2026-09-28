import type { ReactNode } from 'react'
import Icon from './Icon'

type SheetHeaderProps = {
  /** The tile of the meal a sheet acts on, where there is one. */
  lead?: ReactNode
  title: string
  subtitle?: string
  onClose: () => void
  /** Controls belonging to the sheet itself, before the close button. */
  actions?: ReactNode
  /** The mobile grab handle above the heading — omitted for an anchored panel. */
  grabHandle?: boolean
}

/**
 * The standard header every sheet carries: the tile of the meal it acts on
 * where there is one, a title, a subtitle, and a close button. See PLAN.md §6.
 */
export default function SheetHeader({
  lead,
  title,
  subtitle,
  onClose,
  actions,
  grabHandle = false,
}: SheetHeaderProps) {
  return (
    <>
      {grabHandle && (
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong md:hidden" />
      )}
      <div className="mb-4 flex items-center gap-3">
        {lead}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-medium">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 truncate text-[13px] text-ink-3">{subtitle}</p>
          )}
        </div>
        {actions}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1.5 flex h-9 w-9 items-center justify-center rounded-full text-ink-3 hover:bg-surface-1"
        >
          <Icon name="x" />
        </button>
      </div>
    </>
  )
}
