import type { Unit, UnitFamily } from '../types'

/**
 * The units that are their own base: what an amount is summed and stored in.
 * Mass sums in grams, volume in millilitres, kitchen measures in teaspoons,
 * and every count unit sums only with itself — a clove is not an each.
 * See PLAN.md §3.
 */
export type BaseUnit =
  | 'g'
  | 'ml'
  | 'tsp'
  | 'each'
  | 'clove'
  | 'bunch'
  | 'sprig'
  | 'can'
  | 'packet'
  | 'slice'
  | 'some'

type UnitSpec = {
  /** The picker's grouping — the chip row this unit is offered in. */
  family: UnitFamily
  /** The unit this one converts into for summing. A base unit's own base is itself. */
  base: BaseUnit
  /** How many base units one of this unit is. Always 1 for a base unit. */
  factor: number
  label: string
  /** Count units only: how the unit reads for any amount but one — '2 cloves'. */
  plural?: string
}

/**
 * The closed unit set of PLAN.md §3, in picker order. `factor` is the
 * conversion to `base`: 1 tbsp = 4 tsp and 1 cup = 50 tsp, the Australian
 * metric spoon. A count unit's factor against itself is 1, which is what
 * makes it never convert into any other count unit.
 */
const UNITS: Record<Unit, UnitSpec> = {
  g: { family: 'mass', base: 'g', factor: 1, label: 'g' },
  kg: { family: 'mass', base: 'g', factor: 1000, label: 'kg' },
  ml: { family: 'volume', base: 'ml', factor: 1, label: 'ml' },
  L: { family: 'volume', base: 'ml', factor: 1000, label: 'L' },
  tsp: { family: 'kitchen', base: 'tsp', factor: 1, label: 'tsp' },
  tbsp: { family: 'kitchen', base: 'tsp', factor: 4, label: 'tbsp' },
  cup: { family: 'kitchen', base: 'tsp', factor: 50, label: 'cup' },
  each: { family: 'count', base: 'each', factor: 1, label: 'each' },
  clove: {
    family: 'count',
    base: 'clove',
    factor: 1,
    label: 'clove',
    plural: 'cloves',
  },
  bunch: {
    family: 'count',
    base: 'bunch',
    factor: 1,
    label: 'bunch',
    plural: 'bunches',
  },
  sprig: {
    family: 'count',
    base: 'sprig',
    factor: 1,
    label: 'sprig',
    plural: 'sprigs',
  },
  can: { family: 'count', base: 'can', factor: 1, label: 'can', plural: 'cans' },
  packet: {
    family: 'count',
    base: 'packet',
    factor: 1,
    label: 'packet',
    plural: 'packets',
  },
  slice: {
    family: 'count',
    base: 'slice',
    factor: 1,
    label: 'slice',
    plural: 'slices',
  },
  some: { family: 'unmeasured', base: 'some', factor: 1, label: 'some' },
}

const UNIT_ORDER = Object.keys(UNITS) as Unit[]

/** Base units in table order: the order two amounts of one ingredient render in. */
export const BASE_UNITS = UNIT_ORDER.filter(
  (unit): unit is BaseUnit => UNITS[unit].base === unit,
)

/** The families in picker order, for the amount step's chip rows. */
export const UNIT_FAMILIES: { id: UnitFamily; label: string }[] = [
  { id: 'mass', label: 'Mass' },
  { id: 'volume', label: 'Volume' },
  { id: 'kitchen', label: 'Spoons & cups' },
  { id: 'count', label: 'Count' },
  { id: 'unmeasured', label: 'Unmeasured' },
]

/** The unit chips a family offers, in table order. */
export function unitsInFamily(family: UnitFamily): Unit[] {
  return UNIT_ORDER.filter(unit => UNITS[unit].family === family)
}

export function familyOf(unit: Unit): UnitFamily {
  return UNITS[unit].family
}

export function unitLabel(unit: Unit): string {
  return UNITS[unit].label
}

/** The unit a new ingredient's amount step opens on, absent a `defaultUnit`. */
export const FALLBACK_UNIT: Unit = 'g'

/**
 * An amount in its family's base unit. A base unit is also the aggregation
 * key: amounts with the same base sum, and amounts with different bases are
 * two amounts against one ingredient. See PLAN.md §3.
 */
export function toBase(
  amount: number,
  unit: Unit,
): { amount: number; base: BaseUnit } {
  const { base, factor } = UNITS[unit]
  return { amount: amount * factor, base }
}

/** The unit a base amount reads best in — the table's 'Rendered as' column. */
function displayUnit(amount: number, base: BaseUnit): Unit {
  if (base === 'g') return amount < 1000 ? 'g' : 'kg'
  if (base === 'ml') return amount < 1000 ? 'ml' : 'L'
  if (base === 'tsp') return amount < 4 ? 'tsp' : amount < 50 ? 'tbsp' : 'cup'
  // A count unit renders as itself, and so does `some`.
  return base
}

/** At most one decimal, never a fraction. See PLAN.md §3. */
function round(amount: number): number {
  return Math.round(amount * 10) / 10
}

function formatNumber(amount: number): string {
  const rounded = round(amount)
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/**
 * An amount in the unit it was entered in, for a recipe row: '200 g',
 * '2 cloves', '1' for a bare count, 'as needed' for an unmeasured one.
 */
export function formatAmount(amount: number, unit: Unit): string {
  if (unit === 'some') return 'as needed'
  if (unit === 'each') return formatNumber(amount)
  const { label, plural } = UNITS[unit]
  const name = plural && round(amount) !== 1 ? plural : label
  return `${formatNumber(amount)} ${name}`
}

/**
 * A summed base amount in its family's most readable unit, for the shopping
 * list: 1200 g reads '1.2 kg', 60 tsp reads '1.2 cups', 2 cloves read
 * '2 cloves', and an unmeasured total reads 'as needed'.
 */
export function formatTotal(amount: number, base: BaseUnit): string {
  const unit = displayUnit(amount, base)
  return formatAmount(amount / UNITS[unit].factor, unit)
}
