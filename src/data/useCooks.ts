import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Cook } from '../types'

/** Subscribes to every cook document — both the plan and the history. See PLAN.md §3. */
export function useCooks() {
  const [cooks, setCooks] = useState<Cook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(collection(db, 'cooks'), (snapshot) => {
      setCooks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Cook))
      setLoading(false)
    })
  }, [])

  return { cooks, loading }
}
