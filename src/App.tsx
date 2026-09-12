import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MealList from './components/MealList'
import { signIn } from './lib/firebase'

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('dark-mode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark-mode', String(dark))
  }, [dark])

  return [dark, setDark] as const
}

/** The full-height two-pane shell: meal library on the left, planner on the right. */
function Shell() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <aside className="overflow-y-auto border-b border-gray-200 md:w-96 md:flex-shrink-0 md:border-b-0 md:border-r dark:border-gray-800">
        <MealList />
      </aside>
      <section className="flex-1 overflow-y-auto">
        <div className="p-4 text-sm text-gray-400 dark:text-gray-600">Planner</div>
      </section>
    </div>
  )
}

function App() {
  const [dark, setDark] = useDarkMode()

  useEffect(() => {
    signIn().catch((error: unknown) => console.error('Anonymous sign-in failed', error))
  }, [])

  return (
    <BrowserRouter>
      <div className="flex h-screen flex-col bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
          <span className="text-lg font-semibold">Meal Plan</span>
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 15a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm9-8a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1ZM4 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1Zm14.95-6.364a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0ZM7.172 16.828a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0ZM18.95 18.95a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 1 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414ZM7.172 7.172a1 1 0 0 1-1.414 0l-.707-.707A1 1 0 0 1 6.465 5.05l.707.707a1 1 0 0 1 0 1.414ZM12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
              </svg>
            )}
          </button>
        </header>

        <Routes>
          <Route path="/" element={<Shell />} />
          <Route path="/week/:date" element={<Shell />} />
          <Route path="/month/:ym" element={<Shell />} />
          <Route path="*" element={<Shell />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
