import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useIsMobile } from '../lib/responsive'

type PopoverProps = {
  open: boolean
  onClose: () => void
  /**
   * The control that toggles `open`. It is rendered inside the popover's own
   * wrapper so that clicking it never registers as an outside click — which
   * would close and immediately reopen the panel.
   */
  trigger: ReactNode
  children: ReactNode
  /** Classes for the wrapper, so a trigger can stretch within a flex row. */
  className?: string
  /** Classes for the anchored panel, typically its width. Sheets are full width. */
  panelClassName?: string
  /**
   * An element outside the wrapper that also counts as inside — a chip whose
   * whole body opens the panel, not just the trigger within it.
   */
  anchorRef?: RefObject<HTMLElement | null>
  /** Heading for the sheet. Anchored panels label themselves in `children`. */
  sheetTitle?: string
}

/**
 * A small panel anchored to its trigger: the day row's meal picker, the cook
 * chip's move/leftovers menu, the meal card's plan menu. Closes on Escape and
 * on an outside click, and flips above or right-aligns itself when there is no
 * room below — both panes scroll, so a panel that opened blindly downwards
 * would be clipped.
 *
 * On a phone it is a bottom sheet instead, which is reachable by thumb and
 * never squeezed against an edge. The sheet is portalled to the body because
 * a dragging cook chip carries a transform, and a `fixed` descendant of a
 * transformed element is positioned against that element rather than the
 * viewport. See PLAN.md §6.
 */
export default function Popover({
  open,
  onClose,
  trigger,
  children,
  className = '',
  panelClassName = '',
  anchorRef,
  sheetTitle,
}: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState({ up: false, alignRight: false })
  const isMobile = useIsMobile()
  const asSheet = isMobile

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    // The sheet's own backdrop absorbs outside clicks.
    if (asSheet) return () => window.removeEventListener('keydown', onKeyDown)

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      if (anchorRef?.current?.contains(target)) return
      onClose()
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, asSheet, anchorRef])

  // Measured in a ref callback, which runs on mount before the browser
  // paints, so the corrected placement is the only one ever drawn.
  const measurePanel = useCallback((panel: HTMLDivElement | null) => {
    const anchor = containerRef.current
    if (!panel || !anchor) return
    const anchorRect = anchor.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()
    const up =
      anchorRect.bottom + panelRect.height + 16 > window.innerHeight &&
      anchorRect.top > panelRect.height + 16
    const alignRight = anchorRect.left + panelRect.width + 16 > window.innerWidth
    setPlacement((current) =>
      current.up === up && current.alignRight === alignRight ? current : { up, alignRight },
    )
  }, [])

  return (
    <div ref={containerRef} className={`relative ${open && !asSheet ? 'z-40' : ''} ${className}`}>
      {trigger}

      {open &&
        (asSheet ? (
          createPortal(
            <div
              className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-[1px]"
              onClick={onClose}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={sheetTitle}
                onClick={(event) => event.stopPropagation()}
                className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-gray-900 shadow-2xl dark:bg-gray-900 dark:text-gray-100"
              >
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
                {sheetTitle && <h2 className="mb-3 text-base font-semibold">{sheetTitle}</h2>}
                {children}
              </div>
            </div>,
            document.body,
          )
        ) : (
          <div
            ref={measurePanel}
            className={`absolute z-30 rounded-xl border border-gray-200 bg-white p-3 text-gray-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ${
              placement.up ? 'bottom-full mb-2' : 'top-full mt-2'
            } ${placement.alignRight ? 'right-0' : 'left-0'} ${panelClassName}`}
          >
            {children}
          </div>
        ))}
    </div>
  )
}
