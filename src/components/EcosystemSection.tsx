import { Link } from 'react-router-dom'
import Reveal from './Reveal'

/**
 * How the projects connect. The diagram is hairline rects, lines and mono
 * labels only — no icons, no gradients.
 */
export default function EcosystemSection() {
  return (
    <section
      data-nav="projects"
      className="border-b border-[var(--line)] bg-[var(--ink-050)] px-[clamp(20px,4vw,72px)] py-[clamp(96px,12vh,200px)]"
    >
      <p className="m-0 mb-6 font-mono text-mono-label uppercase text-[var(--text-lo)]">// How they connect</p>
      <Reveal>
        <h2 className="max-w-[26ch] text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-[1.04] tracking-[-0.025em] text-[var(--text-hi)]">
          These weren't eight unrelated projects.
        </h2>
      </Reveal>
      <div className="mt-[clamp(32px,5vh,56px)] grid items-start gap-[clamp(28px,5vw,72px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,34ch),1fr))]">
        <p className="m-0 max-w-[56ch] text-body-l text-[var(--text-md)]">
          Canvas Downloader exists because Hal needed course material in its vault. hal-voice sits on top
          of Hal. jupyter-tts-alerts was written during the dissertation, because a six-hour run is a long
          time to sit at a desk. Each one came out of using the last one.
        </p>
        <Reveal as="figure" className="m-0">
          <svg
            viewBox="0 0 560 210"
            role="img"
            aria-label="Diagram: canvas-downloader feeds Hal's vault, hal-voice sits on top of Hal, and the dissertation produced jupyter-tts-alerts"
            className="h-auto w-full font-mono text-[11px]"
          >
            <g fill="none" stroke="rgba(255,255,255,.14)">
              <rect x="1" y="24" width="148" height="52" rx="8" />
              <rect x="206" y="24" width="148" height="52" rx="8" stroke="oklch(0.88 0.04 88 / .5)" />
              <rect x="411" y="24" width="148" height="52" rx="8" stroke="oklch(0.62 0.20 27 / .55)" />
              <rect x="1" y="146" width="148" height="52" rx="8" />
              <rect x="206" y="146" width="148" height="52" rx="8" />
              <path d="M149 50 H200" />
              <path d="M354 50 H405" />
              <path d="M149 172 H200" />
              <path d="M280 146 V96" strokeDasharray="3 4" />
            </g>
            <g fill="rgba(255,255,255,.35)">
              <path d="M200 50 l-6 -3.5 v7 z" />
              <path d="M405 50 l-6 -3.5 v7 z" />
              <path d="M200 172 l-6 -3.5 v7 z" />
              <path d="M280 92 l-3.5 6 h7 z" />
            </g>
            <g fill="var(--text-md)">
              <text x="14" y="54">canvas-downloader</text>
              <text x="219" y="54">Hal — vault + RAG</text>
              <text x="424" y="54">hal-voice</text>
              <text x="14" y="176">dissertation</text>
              <text x="219" y="176">jupyter-tts-alerts</text>
            </g>
            <g fill="var(--text-lo)" fontSize="9.5" letterSpacing="1">
              <text x="152" y="42">FEEDS THE VAULT</text>
              <text x="357" y="42">SITS ON TOP OF</text>
              <text x="152" y="164">WRITTEN DURING</text>
              <text x="288" y="118">MEMORY</text>
            </g>
          </svg>
        </Reveal>
      </div>
      <p className="m-0 mt-[clamp(32px,5vh,56px)] font-mono text-[11px] uppercase tracking-[.12em]">
        <Link to="/projects" className="text-[var(--text-hi)] hover:text-[var(--accent)]">
          All eight projects →
        </Link>
      </p>
    </section>
  )
}
