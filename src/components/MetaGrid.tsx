import { ArrowUpRight } from './Icons'
import StatusPill from './StatusPill'
import { Project } from '../data/projects'

/** The label/value mono grid on project pages. */
export default function MetaGrid({ project }: { project: Project }) {
  const rows: [string, React.ReactNode][] = [
    ['Role', project.role],
    ['Stack', project.stack.join(' · ')],
    ['Year', project.year],
    ['Status', <StatusPill key="s" status={project.status} />],
    ['Licence', project.licence ?? '—'],
    [
      'Repo',
      project.repo ? (
        <a
          href={project.repo}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[var(--text-hi)] hover:text-[var(--accent)]"
        >
          {project.repo.replace('https://github.com/', '')}
          <ArrowUpRight />
        </a>
      ) : (
        '—'
      ),
    ],
  ]

  return (
    <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-[var(--line)] py-6 font-mono text-mono-data sm:grid-cols-3 lg:grid-cols-6">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="mb-1.5 text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">{label}</dt>
          <dd className="m-0 text-[var(--text-md)]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
