import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

// MSW worker start - wired fully in WP-02
// if (import.meta.env.DEV) {
//   const { worker } = await import('./lib/mock/browser')
//   await worker.start()
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
