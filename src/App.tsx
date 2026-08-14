import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import SkipLink from './components/SkipLink'
import StatusNav from './components/StatusNav'
import ScrollProgress from './components/ScrollProgress'
import Footer from './components/Footer'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectPage from './pages/ProjectPage'
import CV from './pages/CV'
import NotFound from './pages/NotFound'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  const location = useLocation()

  return (
    <LazyMotion features={domAnimation} strict>
      <SkipLink />
      <StatusNav />
      <ScrollProgress />
      <ScrollManager />
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        >
          <main id="main" className="pt-[46px]">
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<ProjectPage />} />
              <Route path="/cv" element={<CV />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  )
}
