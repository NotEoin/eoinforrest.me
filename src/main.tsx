import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// mark once whether CSS scroll-driven animation is available; the stylesheet
// keys every scroll-timeline rule off .sda so unsupported browsers fall back
// to the Framer Motion whileInView branch instead of finished-state keyframes
if (CSS.supports('animation-timeline: view()')) {
  document.documentElement.classList.add('sda')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
