import { Status } from '../data/projects'

const DOT: Record<Status, string> = {
  Works: 'var(--accent)',
  Prototype: 'var(--accent-2)',
  Partial: 'var(--text-lo)',
  Submitted: 'var(--text-md)',
}

export default function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[var(--line)]
                 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.1em] text-[var(--text-md)]"
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: DOT[status] }}
      />
      {status}
    </span>
  )
}
