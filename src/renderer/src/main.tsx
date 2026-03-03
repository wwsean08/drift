import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

if (globalThis.api.platform === 'darwin') {
  document.body.classList.add('platform-darwin')
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
