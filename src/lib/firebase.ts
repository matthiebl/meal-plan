import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)

let authReady: Promise<void> | null = null

/**
 * Resolves once a user is signed in, anonymously signing in if needed.
 * There is no login UI and no user concept in the interface; this exists
 * solely to stop scripted access by anyone who reads the Firebase config out
 * of the JS bundle. See PLAN.md §7.
 *
 * `onSnapshot` subscriptions must await this before subscribing: firing them
 * in parallel with sign-in races the anonymous auth token, and a listener
 * that gets `permission-denied` before the token attaches does not retry on
 * its own.
 */
export function ensureSignedIn(): Promise<void> {
  authReady ??= new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      user => {
        if (!user) {
          signInAnonymously(auth).catch(reject)
          return
        }
        unsubscribe()
        resolve()
      },
      reject,
    )
  })
  return authReady
}
