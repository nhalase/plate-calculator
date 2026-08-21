import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { initializePwaUpdates } from './pwa'
import './styles.css'

if (import.meta.env.PROD) {
  initializePwaUpdates()
}

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Application root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
