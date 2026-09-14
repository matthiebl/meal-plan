import type { Category } from '../types'

// Path data on a 24×24 grid, drawn as round-capped strokes. The food icons
// are one per category (PLAN.md §5); `plate` stands in for a meal with no
// category. The rest are interface glyphs.
const PATHS = {
  beef: [
    'M4.5 14.5C3 10.5 5.5 5 11 4.5c5-.5 9 2 8.5 6.5-.4 3.6-3.5 5.2-6.5 6.3-3.4 1.2-7.3 1.6-8.5-2.8Z',
    'M12.5 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    'M7 15c1.5.6 3 .6 4.5 0',
  ],
  lamb: [
    'M8.5 10.5v4.5a3.5 3.5 0 0 0 7 0v-4.5',
    'M5.5 11a2.2 2.2 0 0 1 .8-3.6 2.4 2.4 0 0 1 3.4-2.8 2.6 2.6 0 0 1 4.6 0 2.4 2.4 0 0 1 3.4 2.8 2.2 2.2 0 0 1 .8 3.6H5.5Z',
    'M8.5 12.5 4.5 13.5',
    'M15.5 12.5l4 1',
    'M10.5 14.5h.01',
    'M13.5 14.5h.01',
  ],
  pork: [
    'M12 20a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z',
    'M6.3 7.6 5.6 4.3c-.1-.7.5-1.1 1.1-.8l2.6 1.4',
    'M17.7 7.6l.7-3.3c.1-.7-.5-1.1-1.1-.8l-2.6 1.4',
    'M9.5 16h5a2 2 0 0 0 0-4h-5a2 2 0 0 0 0 4Z',
    'M10.5 14h.01',
    'M13.5 14h.01',
  ],
  chicken: [
    'M14.2 13.8a5.2 5.2 0 1 0-4-4c.2 1-.1 1.9-.8 2.6L7.6 14.2',
    'M7.6 14.2a1.9 1.9 0 1 0-2.6 2.6 1.9 1.9 0 1 0 2.6 2.6 1.9 1.9 0 1 0 2.6-2.6L14.2 13.8',
  ],
  egg: [
    'M12 3.5c3.6 0 6.5 5.3 6.5 10a6.5 6.5 0 0 1-13 0c0-4.7 2.9-10 6.5-10Z',
    'M9.5 14a2.5 2.5 0 0 0 2.5 2.5',
  ],
  fish: [
    'M3 12c2.8-3.6 6.2-5.5 10-5.5 3.6 0 6.2 2.2 8 5.5-1.8 3.3-4.4 5.5-8 5.5-3.8 0-7.2-1.9-10-5.5Z',
    'M3 8.5 5.5 12 3 15.5',
    'M16.5 11h.01',
    'M10 9.5c.8 1.6.8 3.4 0 5',
  ],
  seafood: [
    'M12 20.5 3.5 12a8.5 8.5 0 0 1 17 0L12 20.5Z',
    'M12 20.5V5',
    'M12 20.5 7.5 6.5',
    'M12 20.5l4.5-14',
    'M12 20.5 4.2 9',
    'M12 20.5 19.8 9',
  ],
  veggie: [
    'M5 19C5 10.5 10.5 5 19 5c0 8.5-5.5 14-14 14Z',
    'M5 19l9-9',
    'M9.5 14.5V11',
    'M9.5 14.5H13',
  ],
  pasta: [
    'M11 10.2 5 6.5c-1.2-.7-2 0-2 1.3v8.4c0 1.3.8 2 2 1.3l6-3.7',
    'M13 10.2l6-3.7c1.2-.7 2 0 2 1.3v8.4c0 1.3-.8 2-2 1.3l-6-3.7',
    'M11 10h2v4h-2z',
    'M5.5 10v4',
    'M18.5 10v4',
  ],
  rice: [
    'M12 3.5c-1.6 0-2.6 1-3.4 2.4L4.3 13.5c-1.4 2.6 0 5.5 3 5.5h9.4c3 0 4.4-2.9 3-5.5l-4.3-7.6C14.6 4.5 13.6 3.5 12 3.5Z',
    'M9 19v-4.5h6V19',
  ],
  noodles: [
    'M3 11.5h18a9 9 0 0 1-18 0Z',
    'M9 20.5h6',
    'M13 11.5 17 3',
    'M16 11.5 21 4.5',
    'M6.5 11.5c0-2 1.5-2 1.5-4s1.5-2 1.5-4',
  ],
  bread: [
    'M6 20v-8.6A4 4 0 0 1 8 4h8a4 4 0 0 1 2 7.4V20H6Z',
    'M10 9.5l-1 1.5',
    'M14 9.5l-1 1.5',
    'M12 13.5l-1 1.5',
  ],
  potato: [
    'M5.3 15.8c-2-3.6.2-9 4.8-10.7 4.8-1.8 9.9-.4 10.3 3.4.4 3.1-2.4 4.1-2.6 6.6-.3 3.4-3.8 5-6.9 4.7-2.5-.2-4.5-1.7-5.6-4Z',
    'M9 10.5l1 .6',
    'M14.2 8.6l.8-.6',
    'M13 15.2l1 .2',
    'M8.6 15.4l.6-.8',
  ],
  plate: [
    'M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Z',
    'M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z',
  ],

  search: ['M4 10.5a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z', 'M20 20l-4.8-4.8'],
  'chevron-left': ['M15 6l-6 6 6 6'],
  'chevron-right': ['M9 6l6 6-6 6'],
  'chevron-down': ['M6 9l6 6 6-6'],
  'chevron-up': ['M6 15l6-6 6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  sun: [
    'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'M3 12h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7',
  ],
  calendar: [
    'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z',
    'M16 3v4',
    'M8 3v4',
    'M4 11h16',
  ],
  list: [
    'M9 6h11',
    'M9 12h11',
    'M9 18h11',
    'M5 6h.01',
    'M5 12h.01',
    'M5 18h.01',
  ],
  bag: [
    'M6.3 8h11.4a2 2 0 0 1 2 2.2l-.8 8.2a2 2 0 0 1-2 1.6H7.1a2 2 0 0 1-2-1.6l-.8-8.2A2 2 0 0 1 6.3 8Z',
    'M9 11V6a3 3 0 0 1 6 0v5',
  ],
  leftovers: ['M9 14 5 10l4-4', 'M5 10h11a4 4 0 0 1 0 8h-1'],
  'arrow-down': ['M12 5v14', 'M18 13l-6 6-6-6'],
  sort: ['M3 9l4-4 4 4', 'M7 5v14', 'M21 15l-4 4-4-4', 'M17 19V5'],
  trash: [
    'M4 7h16',
    'M10 11v6',
    'M14 11v6',
    'M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12',
    'M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3',
  ],
  pencil: ['M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16v4Z', 'M13.5 6.5l4 4'],
  archive: [
    'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
    'M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8',
    'M10 12h4',
  ],
} satisfies Record<Category | string, string[]>

export type IconName = keyof typeof PATHS

type IconProps = {
  name: IconName
  /** Sizing and colour; the icon draws in `currentColor`. */
  className?: string
  strokeWidth?: number
}

/** An inline stroke icon. Decorative: the control it sits in carries the label. */
export default function Icon({
  name,
  className = 'h-5 w-5',
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      {PATHS[name].map(d => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
