import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db, ensureSignedIn } from '../lib/firebase'

/**
 * Subscribes to a week's shop day, defaulting to its own Saturday until the
 * document says otherwise. See PLAN.md §6.
 */
export function useWeekMeta(saturdayISO: string): string {
  const [subscribedISO, setSubscribedISO] = useState(saturdayISO)
  const [shopDate, setShopDate] = useState(saturdayISO)

  // Reset to the new default the instant the requested week changes, rather
  // than flashing the previous week's shop date until the subscription below
  // catches up. See https://react.dev/learn/you-might-not-need-an-effect.
  if (saturdayISO !== subscribedISO) {
    setSubscribedISO(saturdayISO)
    setShopDate(saturdayISO)
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    ensureSignedIn().then(() => {
      if (cancelled) return
      unsubscribe = onSnapshot(doc(db, 'weeks', saturdayISO), (snapshot) => {
        setShopDate((snapshot.data()?.shopDate as string | undefined) ?? saturdayISO)
      })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [saturdayISO])

  return shopDate
}
