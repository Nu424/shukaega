import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

const GH_PAGES_REDIRECT_KEY = 'shukaega:redirect-path'

if (!import.meta.env.DEV) {
  const storedPath = window.sessionStorage.getItem(GH_PAGES_REDIRECT_KEY)
  if (storedPath) {
    window.sessionStorage.removeItem(GH_PAGES_REDIRECT_KEY)
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (currentPath !== storedPath) {
      window.history.replaceState(null, '', storedPath)
    }
  }
}

const basename = import.meta.env.DEV
  ? '/'
  : import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
