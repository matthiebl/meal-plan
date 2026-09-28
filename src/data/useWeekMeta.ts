import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { fromISODate, nextWeek, toISODate } from '../lib/dates'
import { db, ensureSignedIn } from '../lib/firebase'
import type { Extra, ItemState, Week } from '../types'

export type WeekMeta = {
  /** This week's shop day — its own Saturday until the document says otherwise. */
  shopDate: string
  /** The next week's shop day: the shopping window's exclusive upper bound. */
  nextShopDate: string
  /** Ingredient or extra id -> its state; an absent key is 'toGet'. */
  shopping: Record<string, ItemState>
  /** Ad-hoc items, in the order added. */
  extras: Extra[]
}

// Shared empties keep an untouched week's identity stable across snapshots,
// so a downstream useMemo does not recompute the list for nothing.
const NO_SHOPPING: Record<string, ItemState> = {}
const NO_EXTRAS: Extra[] = []

function defaults(saturdayISO: string, nextSaturdayISO: string): WeekMeta {
  return {
    shopDate: saturdayISO,
    nextShopDate: nextSaturdayISO,
    shopping: NO_SHOPPING,
    extras: NO_EXTRAS,
  }
}

/**
 * A week's shop day, the next week's — which closes the shopping window — and
 * the state of this week's list. Each shop day defaults to its own Saturday
 * until the document says otherwise. See PLAN.md §4 and §6.
 */
export function useWeekMeta(saturdayISO: string): WeekMeta {
  const nextSaturdayISO = toISODate(nextWeek(fromISODate(saturdayISO)))

  const [subscribedISO, setSubscribedISO] = useState(saturdayISO)
  const [meta, setMeta] = useState<WeekMeta>(() =>
    defaults(saturdayISO, nextSaturdayISO),
  )

  // Reset to the new defaults the instant the requested week changes, rather
  // than flashing the previous week's shop date and ticked items until the
  // subscriptions below catch up.
  // See https://react.dev/learn/you-might-not-need-an-effect.
  if (saturdayISO !== subscribedISO) {
    setSubscribedISO(saturdayISO)
    setMeta(defaults(saturdayISO, nextSaturdayISO))
  }

  useEffect(() => {
    let unsubscribeWeek: (() => void) | undefined
    let unsubscribeNext: (() => void) | undefined
    let cancelled = false

    ensureSignedIn().then(() => {
      if (cancelled) return

      unsubscribeWeek = onSnapshot(doc(db, 'weeks', saturdayISO), snapshot => {
        const data = snapshot.data() as Partial<Week> | undefined
        // Each listener patches its own fields, so the next week's shop date
        // arriving does not hand out a new `shopping` map.
        setMeta(current => ({
          ...current,
          shopDate: data?.shopDate ?? saturdayISO,
          shopping: data?.shopping ?? NO_SHOPPING,
          extras: data?.extras ?? NO_EXTRAS,
        }))
      })

      // The window's upper bound. Only this field is read from the next week.
      unsubscribeNext = onSnapshot(
        doc(db, 'weeks', nextSaturdayISO),
        snapshot => {
          const data = snapshot.data() as Partial<Week> | undefined
          setMeta(current => ({
            ...current,
            nextShopDate: data?.shopDate ?? nextSaturdayISO,
          }))
        },
      )
    })

    return () => {
      cancelled = true
      unsubscribeWeek?.()
      unsubscribeNext?.()
    }
  }, [saturdayISO, nextSaturdayISO])

  return meta
}
