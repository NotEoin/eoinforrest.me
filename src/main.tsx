import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// mark once whether CSS scroll-driven animation is available; the stylesheet
// keys every scroll-timeline rule off .sda so unsupported browsers fall back
// to the Framer Motion whileInView branch instead of finished-state keyframes
if (CSS.supports('animation-timeline: view()')) {
  document.documentElement.classList.add('sda')
}

const root = document.getElementById('root')!

const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// the prerender leaves markup in #root; hydrate it rather than throwing it away
if (root.hasChildNodes()) {
  hydrateRoot(root, tree)
} else {
  createRoot(root).render(tree)
}
