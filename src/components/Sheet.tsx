import { useEffect, type ReactNode } from 'react'
import SheetHeader from './SheetHeader'

type SheetProps = {
  /** The tile of the meal this sheet acts on, where there is one. */
  lead?: ReactNode
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  /** aria-label for the dialog when it differs from the title. */
  label?: string
}

/**
 * A bottom sheet below `md`, a centred dialog above it — the shell for a
 * surface too tall to hang off the control that opened it: the recipe sheet,
 * the ingredient picker, the shopping list. Unlike `Popover`, which is
 * anchored-or-sheet, this is never anchored. See PLAN.md §6.
 */
export default function Sheet({
  lead,
  title,
  subtitle,
  onClose,
  children,
  label,
}: SheetProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label ?? title}
        onClick={event => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface-2 text-ink shadow-2xl md:max-h-[90vh] md:rounded-2xl"
      >
        <div className="shrink-0 border-b border-line px-4 pt-2.5 pb-3 md:pt-3">
          <SheetHeader
            grabHandle
            lead={lead}
            title={title}
            subtitle={subtitle}
            onClose={onClose}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5">
          {children}
        </div>
      </div>
    </div>
  )
}
