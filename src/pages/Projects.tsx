import { useState } from 'react'
import { Link } from 'react-router-dom'
import usePageTitle from '../lib/usePageTitle'
import StatusPill from '../components/StatusPill'
import { ArrowUpRight } from '../components/Icons'
import { Category, Project, indexRows } from '../data/projects'

const FILTERS: (Category | 'All')[] = ['All', 'Systems', 'AI / ML', 'Networking', 'Applications', 'Tools']

function Row({ p }: { p: Project }) {
  const inner = (
    <div
      className="pointer-events-none grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 gap-y-1 border-t border-[var(--line)]
                 py-5 transition-[border-color,transform] duration-[180ms] ease-out
                 group-hover:translate-x-1 group-hover:border-[var(--line-2)]
                 md:grid-cols-[2.5rem_minmax(14ch,18ch)_1fr_minmax(12ch,16ch)_5.5rem_auto_1.5rem]"
    >
      <span className="font-mono text-mono-data text-[var(--text-lo)] [font-variant-numeric:tabular-nums]">
        {p.index}
      </span>
      <span className="text-body-m font-medium text-[var(--text-hi)]">
        {p.name}
        {p.slug === 'cramberry' && (
          <span className="ml-2 font-mono text-[10px] uppercase tracking-[.1em] text-[var(--text-lo)]">
            team project
          </span>
        )}
      </span>
      <span className="col-start-2 col-end-4 text-body-s text-[var(--text-md)] md:col-start-auto md:col-end-auto md:truncate">
        {p.hook}
      </span>
      <span className="col-start-2 font-mono text-[11px] text-[var(--text-lo)] md:col-start-auto md:truncate">
        {p.stack.join(', ')}
      </span>
      <span className="hidden font-mono text-[11px] text-[var(--text-lo)] [font-variant-numeric:tabular-nums] md:inline">
        {p.year}
      </span>
      <StatusPill status={p.status} />
      {p.repo ? (
        <a
          href={p.repo}
          target="_blank"
          rel="noreferrer"
          aria-label={`${p.name} repository on GitHub`}
          className="pointer-events-auto relative z-10 hidden justify-self-end text-[var(--text-lo)] hover:text-[var(--accent)] md:block"
        >
          <ArrowUpRight />
        </a>
      ) : (
        <span className="hidden md:block" />
      )}
    </div>
  )

  // row 09 has no page — it stays a row, not a dead link. The row link is a
  // stretched overlay so the repo anchor never nests inside another anchor.
  return (
    <div className="group relative block">
      {p.hasPage && (
        <Link
          to={`/projects/${p.slug}`}
          aria-label={`${p.name} — open the write-up`}
          className="absolute inset-0 z-0 focus-visible:outline-offset-[-2px]"
        />
      )}
      {inner}
    </div>
  )
}

export default function Projects() {
  usePageTitle('Projects')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const rows = indexRows.filter(p => filter === 'All' || p.categories.includes(filter as Category))

  return (
    <div className="px-[clamp(20px,4vw,72px)] pb-[clamp(64px,9vh,112px)] pt-[clamp(64px,9vh,96px)]">
      <header className="max-w-[1200px]">
        <p className="m-0 font-mono text-mono-label uppercase text-[var(--text-lo)]">// All projects</p>
        <h1 className="mt-4 max-w-[52ch] text-body-l text-[var(--text-hi)]">
          Eight personal projects, plus a team one. Each is a repository with a README that explains the
          reasoning, not just the setup.
        </h1>
        <div className="mt-8 flex flex-wrap gap-1.5" role="group" aria-label="Filter projects">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[.1em] transition-colors duration-[120ms]
                ${filter === f
                  ? 'border-[var(--line-2)] text-[var(--text-hi)] shadow-[inset_0_-1px_0_var(--accent)]'
                  : 'border-[var(--line)] text-[var(--text-lo)] hover:text-[var(--text-md)]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-10 border-b border-[var(--line)]">
        {rows.map(p => (
          <Row key={p.slug} p={p} />
        ))}
      </div>
    </div>
  )
}
