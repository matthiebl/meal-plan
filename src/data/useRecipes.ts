import {
  collection,
  doc,
  documentId,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
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

/** Firestore's `in` operator takes at most thirty values. See PLAN.md §3. */
const CHUNK_SIZE = 30

const NO_RECIPES: Map<string, Recipe> = new Map()

function chunk(ids: string[], size: number): string[][] {
  const chunks: string[][] = []
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size))
  }
  return chunks
}

/**
 * The recipes for a set of meals — a week's shopping list. Chunked at thirty
 * ids per `where(documentId(), 'in', …)` query, and subscribed rather than
 * fetched once, so an ingredient added from the list's "no ingredients" entry
 * point lands on the list without a refresh. `recipes` is never subscribed to
 * in full: this query is pinned to the ids asked for. See PLAN.md §3.
 */
export function useRecipes(mealIds: string[]): {
  recipes: Map<string, Recipe>
  loading: boolean
} {
  // The effect keys on a string, not on the array. `mealIds` is rebuilt
  // whenever the cook list changes, and an array dependency would tear the
  // listeners down and rebuild them on every unrelated write.
  const key = useMemo(() => [...new Set(mealIds)].sort().join(','), [mealIds])

  const [subscribedKey, setSubscribedKey] = useState(key)
  const [recipes, setRecipes] = useState<Map<string, Recipe>>(NO_RECIPES)
  const [loading, setLoading] = useState(key !== '')

  // Reset to the defaults the instant the requested ids change, rather than
  // flashing the previous set's recipes until the subscriptions below catch
  // up. See https://react.dev/learn/you-might-not-need-an-effect.
  if (key !== subscribedKey) {
    setSubscribedKey(key)
    setRecipes(NO_RECIPES)
    setLoading(key !== '')
  }

  useEffect(() => {
    const ids = key === '' ? [] : key.split(',')
    if (ids.length === 0) return

    const chunks = chunk(ids, CHUNK_SIZE)
    const merged = new Map<string, Recipe>()
    const delivered = new Set<number>()
    const unsubscribes: (() => void)[] = []
    let cancelled = false

    ensureSignedIn().then(() => {
      if (cancelled) return
      chunks.forEach((chunkIds, index) => {
        unsubscribes.push(
          onSnapshot(
            query(collection(db, 'recipes'), where(documentId(), 'in', chunkIds)),
            snapshot => {
              // Each chunk owns a disjoint set of ids, so replacing its
              // share of the map is what drops a recipe that no longer
              // matches.
              for (const id of chunkIds) merged.delete(id)
              for (const recipeDoc of snapshot.docs) {
                merged.set(recipeDoc.id, {
                  id: recipeDoc.id,
                  ...recipeDoc.data(),
                } as Recipe)
              }
              delivered.add(index)
              setRecipes(new Map(merged))
              if (delivered.size === chunks.length) setLoading(false)
            },
          ),
        )
      })
    })

    return () => {
      cancelled = true
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [key])

  return { recipes, loading }
}
