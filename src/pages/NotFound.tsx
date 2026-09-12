import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="text-center">
      <p className="text-6xl font-bold text-gray-200 dark:text-gray-800 mb-4">404</p>
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">That page doesn't exist.</p>
      <Link
        to="/"
        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
      >
        Go home
      </Link>
    </section>
  )
}
