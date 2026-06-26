import { createBrowserRouter } from 'react-router-dom'
import { signal } from '@preact/signals-react'

const count = signal(0)

function ScaffoldPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">AI Agent Analytics</h1>
      <p className="text-muted-foreground mb-6">Scaffold - WP-01</p>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-lg">Count: {count.value}</span>
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          onClick={() => { count.value++ }}
        >
          Increment
        </button>
      </div>
      <button
        className="px-4 py-2 border border-border rounded-md hover:bg-muted"
        onClick={() => { document.documentElement.classList.toggle('dark') }}
      >
        Toggle dark mode
      </button>
    </div>
  )
}

// WP-04 replaces this placeholder with the real dashboard route.
export const router = createBrowserRouter([
  {
    path: '*',
    element: <ScaffoldPage />,
  },
])
