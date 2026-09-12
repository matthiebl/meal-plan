export default function Home() {
  return (
    <>
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Welcome to My App</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
          A clean starting point for your next React + Tailwind project.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">
            Get started
          </button>
          <button className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Learn more
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: "Feature One", body: "Describe what makes this feature valuable to your users." },
          { title: "Feature Two", body: "Describe what makes this feature valuable to your users." },
          { title: "Feature Three", body: "Describe what makes this feature valuable to your users." },
        ].map((card) => (
          <div key={card.title} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4" />
            <h2 className="font-semibold mb-1">{card.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.body}</p>
          </div>
        ))}
      </section>
    </>
  )
}
