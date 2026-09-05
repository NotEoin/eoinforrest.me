import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import { CV_PDF } from '../data/projects'

const ROWS: [string, React.ReactNode][] = [
  [
    'Education',
    <>
      BSc (Hons) Computer Science — First-Class Honours
      <br />
      <span className="text-[var(--text-md)]">Newcastle University · 2023–2026</span>
    </>,
  ],
  [
    'Dissertation',
    <>
      From Latent Concept Vectors to Anatomy-Conditioned Dense Readouts
      <br />
      <span className="text-[var(--text-md)]">Deep-learning interpretability and computer vision</span>
    </>,
  ],
  [
    'Strongest modules',
    <span className="font-mono text-mono-data leading-[1.9]">
      Computer Systems Design &amp; Architectures 96 · Algorithm Design &amp; Analysis 86 · Cryptography 80
    </span>,
  ],
  ['Now', <>Looking for a graduate software engineering role — backend, systems or applied AI</>],
]

export default function CVStripSection() {
  return (
    <section
      data-nav="cv"
      className="border-b border-[var(--line)] px-[clamp(20px,4vw,72px)] py-[clamp(96px,12vh,200px)]"
    >
      <p className="m-0 mb-[clamp(28px,4vh,48px)] font-mono text-mono-label uppercase text-[var(--text-lo)]">
        // The short version
      </p>
      <dl className="m-0 max-w-[110ch]">
        {ROWS.map(([label, value], i) => (
          <Reveal key={label}>
            <div
              className={`grid gap-[clamp(8px,2vw,40px)] border-t border-[var(--line)] py-5
                          sm:grid-cols-[minmax(16ch,20ch)_1fr] ${i === ROWS.length - 1 ? 'border-b' : ''}`}
            >
              <dt className="font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">{label}</dt>
              <dd className="m-0 text-body-m leading-relaxed text-[var(--text-hi)]">{value}</dd>
            </div>
          </Reveal>
        ))}
      </dl>
      <div className="mt-[clamp(28px,4vh,44px)] flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[.12em]">
        <Link to="/cv" className="text-[var(--text-hi)] hover:text-[var(--accent)]">Full CV →</Link>
        <a href={CV_PDF} download className="text-[var(--text-md)] hover:text-[var(--accent)]">Download PDF ↓</a>
      </div>
    </section>
  )
}
