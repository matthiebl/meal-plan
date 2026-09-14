import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db, ensureSignedIn } from '../lib/firebase'
import type { Cook } from '../types'

/** Subscribes to every cook document — both the plan and the history. See PLAN.md §3. */
export function useCooks() {
  const [cooks, setCooks] = useState<Cook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    ensureSignedIn().then(() => {
      if (cancelled) return
      unsubscribe = onSnapshot(collection(db, 'cooks'), snapshot => {
        setCooks(
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Cook),
        )
        setLoading(false)
      })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return { cooks, loading }
}
