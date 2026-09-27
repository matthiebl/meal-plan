import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db, ensureSignedIn } from '../lib/firebase'
import type { Recipe } from '../types'

/**
 * One meal's recipe, live for as long as its sheet — or the menu counting its
 * ingredients — is open. The sheet has no Save button, so the write is the
 * update: a local write reaches this listener before the server acknowledges
 * it, and the sheet holds no copy of the items that could go stale. See
 * PLAN.md §6.
 */
export function useRecipe(mealId: string): {
  recipe: Recipe | null
  loading: boolean
} {
  const [subscribedId, setSubscribedId] = useState(mealId)
  const [state, setState] = useState<{
    recipe: Recipe | null
    loading: boolean
  }>({ recipe: null, loading: true })

  // Reset to the defaults the instant the requested meal changes, rather
  // than flashing the previous meal's recipe until the subscription below
  // catches up. See https://react.dev/learn/you-might-not-need-an-effect.
  if (mealId !== subscribedId) {
    setSubscribedId(mealId)
    setState({ recipe: null, loading: true })
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    ensureSignedIn().then(() => {
      if (cancelled) return
      unsubscribe = onSnapshot(doc(db, 'recipes', mealId), snapshot => {
        setState({
          recipe: snapshot.exists()
            ? ({ id: snapshot.id, ...snapshot.data() } as Recipe)
            : null,
          loading: false,
        })
      })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [mealId])

  return state
}
