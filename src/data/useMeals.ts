import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db, ensureSignedIn } from '../lib/firebase'
import type { Meal } from '../types'

/** Subscribes to every meal document. */
export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    ensureSignedIn().then(() => {
      if (cancelled) return
      unsubscribe = onSnapshot(collection(db, 'meals'), snapshot => {
        setMeals(
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Meal),
        )
        setLoading(false)
      })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return { meals, loading }
}
