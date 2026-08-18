import { ReactNode } from 'react'
import Reveal from './Reveal'

/** A titled prose section on a project page. 68ch measure, mono eyebrow. */
export default function ProseBlock({
  id,
  title,
  children,
  wide = false,
}: {
  id?: string
  title: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <section id={id} className="border-t border-[var(--line)] py-[clamp(40px,6vh,72px)]">
      <Reveal>
        <h2 className="mb-7 font-mono text-mono-label uppercase text-[var(--text-lo)]">// {title}</h2>
      </Reveal>
      <div className={`space-y-5 text-body-m leading-relaxed text-[var(--text-md)] ${wide ? '' : 'max-w-[68ch]'}`}>
        {children}
      </div>
    </section>
  )
}

/** A decision sub-section: what was chosen, and what it replaced. */
export function Decision({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="max-w-[68ch] border-l border-[var(--line-2)] pl-5">
      <h3 className="text-body-m font-medium text-[var(--text-hi)]">{title}</h3>
      {children && <div className="mt-1.5 space-y-3">{children}</div>}
    </div>
  )
}

/** Inline code inside prose — mono, at the high-contrast text weight. */
export function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-mono-data text-[var(--text-hi)]">{children}</code>
}

/** The claim a paragraph goes on to support. Emphasis, not shouting. */
export function Key({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-[var(--text-hi)]">{children}</strong>
}
