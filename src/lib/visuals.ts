import type { ColorToken, Fill, MealVisual } from '../types'

/** The ten closed colour tokens, in swatch order. See PLAN.md §5. */
export const COLOR_TOKENS: ColorToken[] = [
  'slate',
  'rose',
  'red',
  'amber',
  'lime',
  'emerald',
  'teal',
  'sky',
  'indigo',
  'violet',
]

/** The three closed fill treatments, in picker order. See PLAN.md §5. */
export const FILLS: Fill[] = ['solid', 'soft', 'outline']

// Written out per color/fill so Tailwind's scanner can see each literal
// class name — a template-built string like `bg-meal-${color}` would not
// be detected and so would never be generated.
const CHIP_CLASSES: Record<ColorToken, Record<Fill, string>> = {
  slate: {
    solid: 'bg-meal-slate text-white',
    soft: 'bg-meal-slate/10 text-meal-slate',
    outline: 'border border-meal-slate bg-transparent text-meal-slate',
  },
  rose: {
    solid: 'bg-meal-rose text-white',
    soft: 'bg-meal-rose/10 text-meal-rose',
    outline: 'border border-meal-rose bg-transparent text-meal-rose',
  },
  red: {
    solid: 'bg-meal-red text-white',
    soft: 'bg-meal-red/10 text-meal-red',
    outline: 'border border-meal-red bg-transparent text-meal-red',
  },
  amber: {
    solid: 'bg-meal-amber text-white',
    soft: 'bg-meal-amber/10 text-meal-amber',
    outline: 'border border-meal-amber bg-transparent text-meal-amber',
  },
  lime: {
    solid: 'bg-meal-lime text-white',
    soft: 'bg-meal-lime/10 text-meal-lime',
    outline: 'border border-meal-lime bg-transparent text-meal-lime',
  },
  emerald: {
    solid: 'bg-meal-emerald text-white',
    soft: 'bg-meal-emerald/10 text-meal-emerald',
    outline: 'border border-meal-emerald bg-transparent text-meal-emerald',
  },
  teal: {
    solid: 'bg-meal-teal text-white',
    soft: 'bg-meal-teal/10 text-meal-teal',
    outline: 'border border-meal-teal bg-transparent text-meal-teal',
  },
  sky: {
    solid: 'bg-meal-sky text-white',
    soft: 'bg-meal-sky/10 text-meal-sky',
    outline: 'border border-meal-sky bg-transparent text-meal-sky',
  },
  indigo: {
    solid: 'bg-meal-indigo text-white',
    soft: 'bg-meal-indigo/10 text-meal-indigo',
    outline: 'border border-meal-indigo bg-transparent text-meal-indigo',
  },
  violet: {
    solid: 'bg-meal-violet text-white',
    soft: 'bg-meal-violet/10 text-meal-violet',
    outline: 'border border-meal-violet bg-transparent text-meal-violet',
  },
}

/**
 * The classes for a meal's visual, applied wherever its id appears (meal
 * card, week chip, month chip) so the same meal always renders identically.
 */
export function chipClasses(visual: MealVisual): string {
  return CHIP_CLASSES[visual.color][visual.fill]
}

/** A swatch's own background, used by the colour picker — always the solid treatment. */
export function swatchClasses(color: ColorToken): string {
  return CHIP_CLASSES[color].solid
}
