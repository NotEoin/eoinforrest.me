import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { m, useReducedMotion } from 'framer-motion'
import MediaPlate from './MediaPlate'
import { Project } from '../data/projects'

const supportsSDA =
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')

export interface ActCopy {
  eyebrow: string
  /** the project's own name — nothing else belongs in the display line */
  title: string
  /** the hero line from the project's README, verbatim */
  tagline: string
  /** the README's opening paragraph */
  hook: string
  stackRow: string
  align: 'left' | 'right' | 'full'
}

/**
 * One full-screen act of the reel. The plate is sticky and cross-fades via a
 * CSS view-timeline where supported; elsewhere the title falls back to a
 * Framer Motion whileInView reveal and the plate stays static — composed
 * either way, no hard cuts.
 *
 * The copy is a four-tier ladder: mono eyebrow, the project name at display
 * size, the README hero line as a standfirst, then the description. The
 * standfirst separates from the description by size, weight and colour rather
 * than by a second family — the build is Geist and Geist Mono and nothing
 * else, and a serif here read as an import from a different site.
 */
export default function ActSection({
  project,
  copy,
  actNumber,
  plateOverride,
}: {
  project: Project
  copy: ActCopy
  actNumber: string
  plateOverride?: ReactNode
}) {
  const reduced = useReducedMotion()
  const { align } = copy
  const full = align === 'full'
  const right = align === 'right'

  const scrim = full
    ? 'linear-gradient(0deg, var(--ink-000) 6%, transparent 70%)'
    : right
      ? `linear-gradient(270deg, var(--ink-000) 4%, transparent 62%), linear-gradient(0deg, color-mix(in oklab, ${project.tint} 5%, transparent), transparent 60%)`
      : `linear-gradient(90deg, var(--ink-000) 4%, transparent 62%), linear-gradient(0deg, color-mix(in oklab, ${project.tint} 5%, transparent), transparent 60%)`

  const contentCls = `act__content max-w-[min(56ch,52vw)] max-md:max-w-none ${
    full ? '!max-w-none self-end' : right ? 'justify-self-end text-right' : ''
  }`

  // the standfirst runs a touch wider than the description so a long hero line
  // breaks into two lines rather than four
  const push = right && !full ? 'ml-auto max-md:ml-0' : ''

  const inner = (
    <>
      <p className="m-0 mb-5 font-mono text-mono-label uppercase" style={{ color: project.tint }}>
        {copy.eyebrow}
      </p>
      <h2
        className={
          full
            ? 'max-w-[20ch] text-[clamp(2.5rem,5.4vw,5rem)] font-medium leading-[0.98] tracking-[-0.03em] text-[var(--text-hi)]'
            : 'text-display-l font-medium text-[var(--text-hi)]'
        }
      >
        {copy.title}
      </h2>
      <p
        className={`m-0 mt-[18px] text-[clamp(1.3125rem,2.05vw,1.75rem)] font-light
                    leading-[1.34] tracking-[-0.015em] text-[var(--text-hi)]
                    ${full ? 'max-w-[46ch]' : 'max-w-[42ch]'} ${push}`}
      >
        {copy.tagline}
      </p>
      {full ? (
        <div className="mt-7 grid max-w-[100ch] gap-[clamp(20px,3vw,56px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,26ch),1fr))]">
          <p className="m-0 text-body-m text-[var(--text-md)]">{copy.hook}</p>
          <div>
            <p className="m-0 font-mono text-[12px] text-[var(--text-lo)]">{copy.stackRow}</p>
            <ActLinks project={project} right={false} />
          </div>
        </div>
      ) : (
        <>
          <p className={`m-0 mt-[18px] max-w-[48ch] text-body-m text-[var(--text-md)] ${push}`}>
            {copy.hook}
          </p>
          <p className="m-0 mt-[22px] font-mono text-[12px] text-[var(--text-lo)]">{copy.stackRow}</p>
          <ActLinks project={project} right={right} />
        </>
      )}
    </>
  )

  return (
    <section
      data-nav="work"
      data-act={actNumber}
      id={actNumber === '01' ? 'work' : undefined}
      className={`act ${actNumber === '04' ? 'act--tall' : ''}`}
      aria-label={`Act ${actNumber} — ${project.name}`}
    >
      <div
        className={`act__pin ${right && !full ? 'justify-items-end max-md:justify-items-stretch' : ''}`}
        style={
          project.slug === 'hal-voice'
            ? { background: 'radial-gradient(60% 60% at 26% 50%, color-mix(in oklab, var(--tint-halvoice) 9%, transparent), transparent 70%)' }
            : undefined
        }
      >
        {plateOverride ?? (
          <div className={`act__plate ${full ? 'act__plate--flat' : ''}`}>
            {project.plate && <MediaPlate media={project.plate} tint={project.tint} fill />}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 max-md:hidden" style={{ background: scrim }} />
          </div>
        )}
        {supportsSDA || reduced ? (
          <div className={contentCls}>{inner}</div>
        ) : (
          <m.div
            className={contentCls}
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '0px 0px -20% 0px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {inner}
          </m.div>
        )}
      </div>
    </section>
  )
}

function ActLinks({ project, right }: { project: Project; right: boolean }) {
  return (
    <div
      className={`mt-[26px] flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[.12em] ${
        right ? 'justify-end max-md:justify-start' : ''
      }`}
    >
      <Link to={`/projects/${project.slug}`} className="text-[var(--text-hi)] hover:text-[var(--accent)]">
        Open project →
      </Link>
    </div>
  )
}
