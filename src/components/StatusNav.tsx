import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CV_PDF } from '../data/projects'

/**
 * A status line, not a pill. Fixed to the top edge, 46px tall, zero radius,
 * glass across the whole strip. The path readout is derived by measuring —
 * a rAF-throttled walk over every [data-nav] element — never by trusting
 * IntersectionObserver entries, which only fire on changes and latch onto
 * whichever entry fired last inside 200dvh acts.
 */
export default function StatusNav() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const [section, setSection] = useState('introduction')
  const [act, setAct] = useState<string | null>(null)

  useEffect(() => {
    if (!onHome) {
      setAct(null)
      return
    }
    let raf = 0
    const sync = () => {
      raf = 0
      const marked = Array.from(document.querySelectorAll<HTMLElement>('[data-nav]'))
      const line = 46 + window.innerHeight * 0.25
      let current: HTMLElement | null = null
      for (const el of marked) {
        if (el.getBoundingClientRect().top <= line) current = el
      }
      setSection(current?.dataset.nav ?? 'introduction')
      // the counter stands down outside the reel rather than reporting a stale act
      setAct(current?.dataset.act ?? null)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync)
    }
    sync()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [onHome, pathname])

  const routeSegment = onHome
    ? section
    : pathname.split('/').filter(Boolean).slice(-1)[0] ?? 'introduction'

  const contactActive = onHome && section === 'contact'
  const workActive = onHome && !contactActive

  const segment = (label: string, to: string, active: boolean, hash = false) => {
    const cls = `flex items-center whitespace-nowrap px-3 font-mono text-[10px] uppercase tracking-[.1em]
      transition-colors duration-[120ms] ${active
        ? 'bg-[rgba(255,255,255,.06)] text-[var(--text-hi)] shadow-[inset_0_-1px_0_var(--accent)]'
        : 'text-[var(--text-lo)] hover:text-[var(--text-md)]'}`
    const text = active ? `[ ${label} ]` : label
    if (hash) {
      return (
        <a href={to} className={cls} aria-current={active ? 'page' : undefined}>
          {text}
        </a>
      )
    }
    return (
      <NavLink to={to} className={cls} aria-current={active ? 'page' : undefined}>
        {text}
      </NavLink>
    )
  }

  return (
    <nav
      aria-label="Primary"
      className="liquid-glass-strong fixed inset-x-0 top-0 z-50 flex h-[46px] items-stretch rounded-none
                 border-b border-[var(--line)] pl-[clamp(10px,2vw,16px)]
                 gap-[clamp(10px,2vw,24px)]"
      style={{ overflow: 'visible' }}
    >
      <span className="flex flex-none items-center gap-2.5">
        <Link
          to="/"
          aria-label="Eoin Forrest — home"
          className="flex h-full min-w-[44px] items-center justify-center"
        >
          <span className="grid h-[22px] w-[22px] place-items-center border border-[var(--line-2)]
                           font-mono text-[10px] tracking-[.04em] text-[var(--text-hi)]">
            EF
          </span>
        </Link>
        <span className="hidden items-center gap-1.5 font-mono text-[11px] text-[var(--text-lo)] sm:flex">
          eoinforrest.me
          <span className="text-[var(--line-2)]">/</span>
          <span className="text-[var(--text-md)]">{routeSegment}</span>
          <span aria-hidden="true" className="caret-blink text-[var(--accent)]">▍</span>
        </span>
      </span>

      <ul className="nav-scroll m-0 flex min-w-0 list-none items-stretch gap-0.5 p-0">
        <li className="flex">{segment('work', '/', workActive)}</li>
        <li className="flex">{segment('projects', '/projects', pathname.startsWith('/projects'))}</li>
        <li className="flex">{segment('cv', '/cv', pathname === '/cv')}</li>
        <li className="flex">{segment('contact', onHome ? '#contact' : '/#contact', contactActive, onHome)}</li>
      </ul>

      <span className="ml-auto flex flex-none items-stretch font-mono text-[var(--text-lo)] [font-variant-numeric:tabular-nums]">
        {act && (
          <span className="hidden items-center whitespace-nowrap px-4 text-[11px] min-[860px]:flex">
            act {act}/05
          </span>
        )}
        <a
          href={CV_PDF}
          download
          className="flex items-center whitespace-nowrap border-l border-[var(--line)]
                     px-[clamp(12px,2vw,18px)] text-[10px] uppercase tracking-[.12em] text-[var(--text-hi)]
                     transition-colors duration-[120ms] hover:bg-[rgba(255,255,255,.04)]"
        >
          CV ↓
        </a>
      </span>
    </nav>
  )
}
