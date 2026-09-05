import { ReactNode, useEffect, useRef, useState } from 'react';

/**
 * DemoFrame — the shell every interactive demo lives in.
 *
 * Contract (see Design Dossier Part 4):
 *  - 16:10 stage, glass toolbar, glass readout
 *  - autoplays a scripted loop when scrolled into view, hands over on first interaction
 *  - pauses off-screen and under prefers-reduced-motion
 *  - readout is aria-live, and every demo carries a text alternative
 */

export type Readout = Record<string, string | number>;

export function useInView<T extends HTMLElement>(rootMargin = '200px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return { ref, inView };
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

interface DemoFrameProps {
  title: string;
  /** one sentence: what this demo demonstrates */
  explains: string;
  /** screen-reader / no-JS alternative, 1–3 sentences */
  alternative: string;
  tint: string;
  toolbar?: ReactNode;
  readout?: Readout;
  onReset?: () => void;
  paused?: boolean;
  onTogglePlay?: () => void;
  children: ReactNode;
}

export default function DemoFrame({
  title, explains, alternative, tint, toolbar, readout, onReset, paused, onTogglePlay, children,
}: DemoFrameProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <figure
      className="relative w-full"
      style={{ ['--tint' as string]: tint }}
      aria-label={title}
    >
      {/* stage */}
      <div className="relative overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--ink-050)]"
           style={{ aspectRatio: '16 / 10', minHeight: 'min(60vh, 420px)' }}>
        {children}

        {/* toolbar */}
        <div className="liquid-glass absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-x-4 gap-y-2
                        rounded-[14px] px-3 py-2 md:inset-x-4 md:bottom-4 md:px-4">
          {toolbar}
          <div className="ml-auto flex items-center gap-2">
            {onTogglePlay && (
              <button type="button" onClick={onTogglePlay}
                className="rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-md)]
                           hover:text-[var(--text-hi)] focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
                {paused ? 'Play' : 'Pause'}
              </button>
            )}
            {onReset && (
              <button type="button" onClick={onReset}
                className="rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-md)]
                           hover:text-[var(--text-hi)] focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
                Reset <span aria-hidden="true">(R)</span>
              </button>
            )}
            <button type="button" aria-expanded={helpOpen} onClick={() => setHelpOpen(v => !v)}
              className="grid h-7 w-7 place-items-center rounded-full border border-[var(--line-2)]
                         font-mono text-[11px] text-[var(--text-md)] hover:text-[var(--text-hi)]
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-[var(--accent)]">
              ?<span className="sr-only">What am I looking at?</span>
            </button>
          </div>
        </div>

        {/* readout */}
        {readout && (
          <dl className="liquid-glass absolute right-3 top-3 grid grid-cols-[auto_auto] gap-x-3 gap-y-1
                         rounded-[14px] px-3 py-2 font-mono text-[11px] md:right-4 md:top-4"
              aria-live="polite">
            {Object.entries(readout).map(([k, v]) => (
              <div key={k} className="col-span-2 grid grid-cols-subgrid">
                <dt className="uppercase tracking-[.12em] text-[var(--text-lo)]">{k}</dt>
                <dd className="text-right text-[var(--text-hi)]">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {helpOpen && (
          <div className="liquid-glass-strong absolute left-3 top-3 max-w-[38ch] rounded-[14px] p-4
                          text-[13px] leading-relaxed text-[var(--text-md)] md:left-4 md:top-4">
            {explains}
          </div>
        )}
      </div>

      <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">
        A faithful reconstruction of the real behaviour, running in your browser. The actual implementation is in the repository.
      </figcaption>
      <p className="sr-only">{alternative}</p>
    </figure>
  );
}

/** Small labelled control primitives shared by the demos. */
export function Slider(
  { label, value, min, max, step = 1, onChange, suffix }:
  { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }
) {
  return (
    <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">
      {label}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="h-1 w-24 accent-[var(--accent)]" />
      <span className="tabular-nums text-[var(--text-hi)]">{value}{suffix}</span>
    </label>
  );
}

export function Toggle(
  { label, options, value, onChange }:
  { label?: string; options: [string, string]; value: 0 | 1; onChange: (v: 0 | 1) => void }
) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">{label}</span>}
      <div className="flex overflow-hidden rounded-full border border-[var(--line-2)]">
        {options.map((opt, i) => (
          <button key={opt} type="button" onClick={() => onChange(i as 0 | 1)}
            aria-pressed={value === i}
            className={`px-3 py-1 font-mono text-[11px] uppercase tracking-[.1em] transition-colors
              ${value === i ? 'bg-[var(--tint)] text-[var(--ink-000)]' : 'text-[var(--text-md)] hover:text-[var(--text-hi)]'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
