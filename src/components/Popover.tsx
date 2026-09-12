import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

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
  /** Classes for the panel itself, typically its width. */
  panelClassName?: string
}

/**
 * A small panel anchored to its trigger: the day row's meal picker, the cook
 * chip's move/leftovers menu. Closes on Escape and on an outside click, and
 * flips above or right-aligns itself when there is no room below — both panes
 * scroll, so a panel that opened blindly downwards would be clipped.
 */
export default function Popover({
  open,
  onClose,
  trigger,
  children,
  className = '',
  panelClassName = '',
}: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState({ up: false, alignRight: false })

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) onClose()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

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
    <div ref={containerRef} className={`relative ${open ? 'z-40' : ''} ${className}`}>
      {trigger}
      {open && (
        <div
          ref={measurePanel}
          className={`absolute z-30 rounded-xl border border-gray-200 bg-white p-3 text-gray-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ${
            placement.up ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${placement.alignRight ? 'right-0' : 'left-0'} ${panelClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
