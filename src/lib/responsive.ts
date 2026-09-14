import { useSyncExternalStore } from 'react'

/** Below Tailwind's `md` breakpoint, which is where the panes become tabs. */
const mobileQuery = window.matchMedia('(max-width: 767px)')

function subscribe(onChange: () => void) {
  mobileQuery.addEventListener('change', onChange)
  return () => mobileQuery.removeEventListener('change', onChange)
}

/**
 * True on a phone-width viewport, where one pane shows at a time and anchored
 * panels open as bottom sheets instead. Layout that CSS alone can express
 * stays in `md:` classes; this is for the cases where the markup itself
 * differs. See PLAN.md §6.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => mobileQuery.matches)
}
