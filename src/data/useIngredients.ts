import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db, ensureSignedIn } from '../lib/firebase'
import type { Ingredient } from '../types'

/**
 * Subscribes to every ingredient document. The table is smaller than the cook
 * history and the whole app searches it. See PLAN.md §3.
 */
export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    ensureSignedIn().then(() => {
      if (cancelled) return
      unsubscribe = onSnapshot(collection(db, 'ingredients'), snapshot => {
        setIngredients(
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Ingredient),
        )
        setLoading(false)
      })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return { ingredients, loading }
}
