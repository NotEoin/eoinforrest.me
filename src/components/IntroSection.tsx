import { useState } from 'react'
import Placeholder from './Placeholder'
import { ArrowDown } from './Icons'
import { CV_PDF, GITHUB, LINKEDIN } from '../data/projects'

/** The portrait, falling back to the striped placeholder until the file lands
 *  — same path, same 4:5 box, so the swap costs no layout. */
function Headshot() {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <Placeholder id="headshot" ratio="4/5" label="HEADSHOT" file="media/headshot.jpg" size="1000×1250" />
  }
  return (
    <img
      src="/media/headshot.jpg"
      alt="Eoin Forrest"
      width={1000}
      height={1250}
      className="w-full rounded-[20px] border border-[var(--line)]"
      style={{ aspectRatio: '4 / 5', objectFit: 'cover' }}
      onError={() => setFailed(true)}
    />
  )
}

/**
 * The opening — a normal section, not a hero and not full-height. Nothing in
 * here is larger than title-m; the scale belongs to the reel.
 */
export default function IntroSection() {
  return (
    <section className="border-b border-[var(--line)] px-[clamp(20px,4vw,72px)] pb-[clamp(64px,9vh,112px)] pt-[clamp(86px,12vh,150px)]">
      <div className="grid max-w-[1200px] items-start gap-[clamp(28px,4vw,72px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,24ch),1fr))]">
        <div className="order-2">
          <p className="enter m-0 mb-[18px] font-mono text-mono-label uppercase text-[var(--text-lo)]">
            // Introduction
          </p>
          <h1
            className="enter text-title-m font-medium text-[var(--text-hi)]"
            style={{ ['--enter-delay' as string]: '60ms' }}
          >
            Eoin Forrest
          </h1>
          <p
            className="enter m-0 mt-3.5 max-w-[52ch] text-body-l text-[var(--text-hi)]"
            style={{ ['--enter-delay' as string]: '140ms' }}
          >
            Computer Science graduate working in backend, systems and applied AI.
          </p>
          <p
            className="enter m-0 mt-5 max-w-[60ch] text-body-m text-[var(--text-md)]"
            style={{ ['--enter-delay' as string]: '220ms' }}
          >
            A first-class BSc from Newcastle University, 2026. Most of what I build sits close to the
            machine: local retrieval-augmented assistants, real-time control systems, passive network
            sensing. This site is the working record — seven projects and the reasoning behind each one.
          </p>
          <dl
            className="enter m-0 mt-[26px] grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 font-mono text-mono-data leading-[1.7]"
            style={{ ['--enter-delay' as string]: '300ms' }}
          >
            <dt className="text-[var(--text-lo)]">Based</dt>
            <dd className="m-0 text-[var(--text-md)]">London / Newcastle</dd>
            <dt className="text-[var(--text-lo)]">Looking for</dt>
            <dd className="m-0 text-[var(--text-md)]">A graduate software engineering role</dd>
            <dt className="text-[var(--text-lo)]">Elsewhere</dt>
            <dd className="m-0 text-[var(--text-md)]">
              <a href={GITHUB} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">GitHub @NotEoin</a>
              {' · '}
              <a href={LINKEDIN} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">LinkedIn /in/eoin-forrest</a>
            </dd>
          </dl>
          <div
            className="enter mt-7 flex flex-wrap gap-3"
            style={{ ['--enter-delay' as string]: '380ms' }}
          >
            <a href="#work" className="btn btn-primary">
              <span className="text-[var(--accent)] [font-variant-numeric:tabular-nums]">01</span>
              Selected work
              <ArrowDown className="text-[var(--text-lo)]" />
            </a>
            <a href={CV_PDF} download className="btn btn-secondary">
              Download CV
              <ArrowDown className="text-[var(--text-lo)]" />
            </a>
          </div>
        </div>

        <figure className="enter order-1 m-0 max-w-[340px]">
          <Headshot />
          <figcaption className="mt-2.5 font-mono text-[10px] uppercase tracking-[.12em] text-[var(--text-lo)]">
            Newcastle, 2026
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
