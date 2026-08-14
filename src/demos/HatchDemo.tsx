import { useCallback, useEffect, useRef, useState } from 'react';
import DemoFrame, { Toggle, useInView, usePrefersReducedMotion } from '../components/DemoFrame';

/**
 * HatchDemo — the creature leaves the window.
 *
 * One position in a global coordinate space, owned by the demo and drawn by
 * whichever "surface" currently contains it: inside the mocked Hatch window the
 * window draws it; outside, a transparent overlay does. That is the real
 * architecture (main-process position + IPC broadcast + click-through overlays),
 * reduced to one page.
 *
 * Easter egg: "Let it out" releases the sprite onto the document itself,
 * bounded to the current section, auto-returning after 20s or on route change.
 */

const TINT = 'oklch(0.82 0.13 74)';
const MOODS = ['content', 'curious', 'sleepy', 'restless', 'pleased', 'wary', 'low', 'bright'] as const;
type Mood = typeof MOODS[number];

/** the eight demeanours as face offsets — the real app composites faces at
 *  runtime from one anchor table rather than baking them into the art */
const FACE: Record<Mood, { eye: number; brow: number; mouth: number }> = {
  content:  { eye: 1.0, brow: 0,    mouth: 1 },
  curious:  { eye: 1.2, brow: -1,   mouth: 0 },
  sleepy:   { eye: 0.4, brow: 1,    mouth: 0 },
  restless: { eye: 1.1, brow: -0.5, mouth: -1 },
  pleased:  { eye: 0.8, brow: 0,    mouth: 2 },
  wary:     { eye: 0.9, brow: 1.5,  mouth: -1 },
  low:      { eye: 0.7, brow: 1,    mouth: -2 },
  bright:   { eye: 1.3, brow: -1,   mouth: 2 },
};

export default function HatchDemo() {
  const { ref: hostRef, inView } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);

  const [mood, setMood] = useState<Mood>('curious');
  const [docked, setDocked] = useState<0 | 1>(1);       // 0 = docked (Wayland fallback), 1 = roaming
  const [released, setReleased] = useState(false);      // the easter egg
  const [paused, setPaused] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [surface, setSurface] = useState<'window' | 'overlay' | 'page'>('window');
  const [pos, setPos] = useState({ x: 0.18, y: 0.62 });

  const p = useRef({ x: 0.18, y: 0.62, vx: 0.045, dir: 1, phase: 0 });

  const reset = useCallback(() => {
    p.current = { x: 0.18, y: 0.62, vx: 0.045, dir: 1, phase: 0 };
    setReleased(false); setBubble(null); setMood('curious'); setDocked(1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (inView && e.key.toLowerCase() === 'r') reset(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inView, reset]);

  /* auto-return from the page */
  useEffect(() => {
    if (!released) return;
    const id = window.setTimeout(() => setReleased(false), 20_000);
    return () => clearTimeout(id);
  }, [released]);

  /* ------------------------------------------------------------------ the tick */
  useEffect(() => {
    if (!inView || paused || reduced) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(48, now - last) / 1000; last = now;
      const s = p.current;
      s.phase += dt * 6;
      // docked mode keeps the creature inside the Hatch window (0.06–0.34)
      const [lo, hi] = docked === 0 ? [0.06, 0.34] : [0.03, 0.95];
      s.x += s.vx * s.dir * dt;
      if (s.x > hi) { s.x = hi; s.dir = -1; }
      if (s.x < lo) { s.x = lo; s.dir = 1; }
      s.y = 0.62 + Math.sin(s.phase * 0.35) * 0.02;
      setPos({ x: s.x, y: s.y });
      setSurface(released ? 'page' : s.x < 0.36 ? 'window' : 'overlay');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, paused, reduced, docked, released]);

  /* the released sprite walks the document, bounded to its section */
  useEffect(() => {
    if (!released || reduced) return;
    const el = spriteRef.current;
    const section = stageRef.current?.closest('section') ?? document.body;
    if (!el) return;
    let raf = 0, x = 0, dir = 1, last = performance.now();
    const rect = () => section.getBoundingClientRect();
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(48, now - last) / 1000; last = now;
      const r = rect();
      x += 90 * dir * dt;
      if (x > r.width - 48) dir = -1;
      if (x < 0) dir = 1;
      el.style.transform = `translate3d(${x}px, ${r.height - 56}px, 0) scaleX(${dir})`;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [released, reduced]);

  const f = FACE[mood];
  const Sprite = ({ scale = 1 }: { scale?: number }) => (
    <svg width={32 * scale} height={32 * scale} viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true">
      {/* placeholder sprite: replace with /media/hatch/hatch-sprite.png (128×32, 4 frames) */}
      <rect x="8" y="10" width="16" height="14" fill={TINT} />
      <rect x="10" y="24" width="4" height="3" fill={TINT} />
      <rect x="18" y="24" width="4" height="3" fill={TINT} />
      <rect x={12} y={14 + f.brow} width={2 * f.eye} height="2" fill="#0a0b0d" />
      <rect x={18} y={14 + f.brow} width={2 * f.eye} height="2" fill="#0a0b0d" />
      <rect x="14" y={19 - f.mouth * 0.5} width="4" height="1.5" fill="#0a0b0d" />
    </svg>
  );

  return (
    <div ref={hostRef}>
      <DemoFrame
        title="Hatch — a creature that leaves the window"
        tint={TINT}
        explains="The creature has one position in a global desktop coordinate space. Inside the Hatch window, the window draws it; once it walks out, a transparent click-through overlay draws it instead — watch the 'surface' readout change as it crosses the edge. Mood drives eight demeanours composited from a single face-anchor table. 'Docked' shows the honest fallback used under native Wayland, where positioning windows at arbitrary screen coordinates is restricted."
        alternative="A reconstruction of Hatch's presence system: a pixel creature with a single position in a global coordinate space, drawn by whichever surface currently contains it — the application window while it is inside, and a transparent desktop overlay once it walks out. Controls change its mood, force it to roam, and switch to the docked fallback used on Wayland."
        readout={{ surface, x: pos.x.toFixed(2), y: pos.y.toFixed(2), mood }}
        onReset={reset}
        paused={paused}
        onTogglePlay={() => setPaused(v => !v)}
        toolbar={
          <>
            <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">
              mood
              <select value={mood} onChange={e => setMood(e.target.value as Mood)}
                className="rounded-full border border-[var(--line-2)] bg-transparent px-2 py-1
                           font-mono text-[11px] text-[var(--text-hi)]">
                {MOODS.map(m => <option key={m} value={m} className="bg-[var(--ink-100)]">{m}</option>)}
              </select>
            </label>
            <Toggle label="window" options={['Docked', 'Roaming']} value={docked} onChange={setDocked} />
            <button type="button" onClick={() => { setBubble('time to check in?'); window.setTimeout(() => setBubble(null), 3200); }}
              className="rounded-full border border-[var(--line-2)] px-3 py-1.5 font-mono text-[11px]
                         uppercase tracking-[.12em] text-[var(--text-md)] hover:text-[var(--text-hi)]">
              Nudge
            </button>
            <button type="button" onClick={() => setReleased(v => !v)} disabled={reduced}
              className="rounded-full border border-[var(--line-2)] px-3 py-1.5 font-mono text-[11px]
                         uppercase tracking-[.12em] text-[var(--text-md)] hover:text-[var(--text-hi)]
                         disabled:opacity-40">
              {released ? 'Bring it back' : 'Let it out'}
            </button>
          </>
        }
      >
        {/* mocked desktop */}
        <div ref={stageRef} className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0"
               style={{ background: 'radial-gradient(120% 90% at 20% 10%, oklch(0.19 0.02 264), oklch(0.10 0.006 264))' }} />

          {/* two neutral app windows */}
          <div className="absolute right-[6%] top-[12%] h-[38%] w-[34%] rounded-[10px] border border-[var(--line)] bg-[var(--ink-050)]" />
          <div className="absolute right-[18%] top-[46%] h-[30%] w-[26%] rounded-[10px] border border-[var(--line)] bg-[var(--ink-050)]" />

          {/* the Hatch window */}
          <div className="liquid-glass absolute left-[4%] top-[16%] h-[62%] w-[32%] rounded-[14px] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[var(--text-lo)]">hatch</p>
            <p className="mt-1 font-mono text-[10px] text-[var(--text-md)]">mood — {mood}</p>
            <div className="mt-3 flex items-end gap-1" aria-hidden="true">
              {[6, 10, 7, 12, 9, 14, 8].map((h, i) => (
                <span key={i} className="w-2 rounded-sm bg-[var(--tint)]" style={{ height: h * 2, opacity: 0.55 }} />
              ))}
            </div>
          </div>

          {/* the creature, drawn by whichever surface owns it */}
          {!released && (
            <div className="pointer-events-none absolute transition-none"
                 style={{
                   left: `${pos.x * 100}%`, top: `${pos.y * 100}%`,
                   transform: `translate(-50%,-50%) scaleX(${p.current.dir})`,
                 }}>
              <Sprite scale={1.6} />
              {bubble && (
                <span className="liquid-glass absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                                 rounded-full px-2 py-1 font-mono text-[10px] text-[var(--text-hi)]">
                  {bubble}
                </span>
              )}
            </div>
          )}

          <p className="pointer-events-none absolute left-4 top-4 max-w-[26ch] font-mono text-[11px]
                        uppercase tracking-[.12em] text-[var(--text-lo)]">
            surface: {surface} · one position, whichever surface owns it draws it
          </p>
        </div>
      </DemoFrame>

      {/* the easter egg: the sprite on the document itself */}
      {released && !reduced && (
        <div ref={spriteRef} className="pointer-events-none absolute left-0 top-0 z-40" aria-hidden="true">
          <Sprite scale={1.8} />
        </div>
      )}
    </div>
  );
}
