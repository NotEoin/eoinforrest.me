import { useCallback, useEffect, useRef, useState } from 'react';
import DemoFrame, { Toggle, useInView, usePrefersReducedMotion } from '../components/DemoFrame';

/**
 * HalVoiceDemo — the lens, and the latency it hides.
 *
 * (1) A faithful web re-implementation of the repo's ui_eye.py: concentric bezel
 *     rings, an additive red glow built from 18 fading rings, lens core, hot
 *     centre and an offset specular highlight — driven by the source's exact
 *     per-state intensity functions.
 * (2) A pipeline timeline showing the same request through the naive serial
 *     pipeline and the streamed one, with a marker on first audio.
 *
 * Silent by default. The optional Play control appears only if the sample exists.
 */

const TINT = 'oklch(0.62 0.20 27)';
const EYE = [220, 30, 20] as const;              // rgb(220,30,20), from ui_eye.py
type State = 'idle' | 'listening' | 'thinking' | 'speaking';

/** intensity(state, t) — ported verbatim from the Python */
function intensity(state: State, t: number, level: number) {
  switch (state) {
    case 'listening': return 1.0;
    case 'thinking':  return 0.55 + 0.18 * Math.sin(7 * t) * Math.sin(2.3 * t);
    case 'speaking':  return Math.min(1, Math.max(0.35, 0.45 + level));
    default:          return 0.30 + 0.10 * (Math.sin(1.2 * t) * 0.5 + 0.5);
  }
}

const REPLY = 'Good evening. The vault has three notes on retrieval budgets. ' +
  'The shortest answer is that context is the scarce resource, not tokens per second.';

/** naive: capture, transcribe, generate ALL, synthesise, play. streamed: pipelined. */
const TIMELINES = {
  naive: [
    { label: 'capture', start: 0, len: 900 },
    { label: 'transcribe', start: 900, len: 700 },
    { label: 'model — full reply', start: 1600, len: 5200 },
    { label: 'synthesise', start: 6800, len: 1900 },
    { label: 'audio out', start: 8700, len: 3200, audio: true },
  ],
  streamed: [
    { label: 'capture', start: 0, len: 900 },
    { label: 'transcribe (CPU)', start: 900, len: 700 },
    { label: 'model — sentence 1', start: 1600, len: 1100 },
    { label: 'model — sentence 2', start: 2700, len: 1500 },
    { label: 'tts s1', start: 2700, len: 800 },
    { label: 'tts s2', start: 4200, len: 900 },
    { label: 'audio out', start: 3500, len: 3400, audio: true },
  ],
} as const;

export default function HalVoiceDemo({ hasSample = false }: { hasSample?: boolean }) {
  const { ref: hostRef, inView } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [state, setState] = useState<State>('idle');
  const [pipeline, setPipeline] = useState<0 | 1>(1);      // 0 = naive, 1 = streamed
  const [typed, setTyped] = useState('');
  const [paused, setPaused] = useState(false);
  const [firstAudio, setFirstAudio] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const level = useRef(0);
  const runStart = useRef<number | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const run = useCallback(() => {
    clearTimers();
    const key = pipeline === 0 ? 'naive' : 'streamed';
    const spec = TIMELINES[key];
    const audio = spec.find(s => 'audio' in s && s.audio)!;
    const total = Math.max(...spec.map(s => s.start + s.len));
    runStart.current = performance.now();
    setFirstAudio(audio.start);
    setTyped('');
    setState('listening');
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    at(900, () => setState('thinking'));
    at(audio.start, () => setState('speaking'));
    // type the reply across the audio window
    const perChar = audio.len / REPLY.length;
    for (let i = 1; i <= REPLY.length; i++) at(audio.start + i * perChar, () => setTyped(REPLY.slice(0, i)));
    at(total + 400, () => { setState('idle'); runStart.current = null; });
  }, [pipeline]);

  const reset = useCallback(() => { clearTimers(); setState('idle'); setTyped(''); setFirstAudio(null); }, []);

  useEffect(() => () => clearTimers(), []);

  /* autoplay the scripted loop while in view, until the user takes over */
  const [userDriving, setUserDriving] = useState(false);
  useEffect(() => {
    if (!inView || paused || reduced || userDriving) return;
    run();
    const id = window.setInterval(run, 11_000);
    return () => { clearInterval(id); clearTimers(); };
  }, [inView, paused, reduced, userDriving, run]);

  /* push to talk */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!inView) return;
      if (e.code === 'Space') { e.preventDefault(); setUserDriving(true); run(); }
      if (e.key.toLowerCase() === 'r') reset();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [inView, run, reset]);

  /* ------------------------------------------------------------------ the lens */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const r = canvas.getBoundingClientRect();
      const t = now / 1000;
      const cx = r.width / 2, cy = r.height / 2;
      const R = Math.min(r.width, r.height) * 0.42;

      if (state === 'speaking') {
        // synthetic amplitude envelope — syllabic, not noise
        level.current = 0.28 * (0.6 + 0.4 * Math.sin(t * 11)) * (0.5 + 0.5 * Math.sin(t * 2.7));
      } else level.current *= 0.9;

      const k = reduced ? intensity(state, 0, 0.2) : intensity(state, t, level.current);

      ctx.clearRect(0, 0, r.width, r.height);
      ctx.fillStyle = 'oklch(0.07 0.004 264)';
      ctx.fillRect(0, 0, r.width, r.height);

      // bezel: concentric grey rings
      for (let i = 0; i < 5; i++) {
        const rr = R * (1 + i * 0.06);
        ctx.strokeStyle = `rgba(255,255,255,${0.10 - i * 0.018})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
      }

      // additive glow — 18 fading rings
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 18; i >= 1; i--) {
        const frac = i / 18;
        const a = 0.055 * k * (1 - frac) ** 1.4;
        ctx.fillStyle = `rgba(${EYE[0]},${EYE[1]},${EYE[2]},${a})`;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.82 * frac + R * 0.12, 0, Math.PI * 2); ctx.fill();
      }
      // lens core
      ctx.fillStyle = `rgba(${EYE[0]},${EYE[1]},${EYE[2]},${0.55 + 0.4 * k})`;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.30, 0, Math.PI * 2); ctx.fill();
      // hot centre
      ctx.fillStyle = `rgba(255,180,150,${0.35 + 0.5 * k})`;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.10, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // offset specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath(); ctx.ellipse(cx - R * 0.22, cy - R * 0.26, R * 0.13, R * 0.07, -0.5, 0, Math.PI * 2); ctx.fill();

      if (runStart.current) setElapsed(Math.round(now - runStart.current));
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [state, reduced]);

  const spec = TIMELINES[pipeline === 0 ? 'naive' : 'streamed'];
  const total = Math.max(...spec.map(s => s.start + s.len));

  return (
    <div ref={hostRef}>
      <DemoFrame
        title="hal-voice — the lens, and the latency it hides"
        tint={TINT}
        explains="The lens is the repo's pygame eye, re-implemented for the browser with the same per-state intensity functions. Below it, the same request runs through two pipelines: the naive one generates the whole reply before synthesising anything, so there are seconds of silence; the streamed one splits the reply into sentences and synthesises sentence one while the model is still writing sentence two. Hold space to talk. Switch pipelines and watch where 'first audio' lands."
        alternative="A reconstruction of the hal-voice interface: a HAL-style lens whose brightness responds to four interaction states, and a timeline comparing a naive serial voice pipeline against a streamed one. In the naive pipeline the first audio arrives after the entire reply has been generated and synthesised; in the streamed pipeline it arrives once the first sentence is ready, roughly two and a half times sooner."
        readout={{
          state,
          'first audio': firstAudio === null ? '—' : `${(firstAudio / 1000).toFixed(1)}s`,
          total: `${(total / 1000).toFixed(1)}s`,
          elapsed: `${(elapsed / 1000).toFixed(1)}s`,
        }}
        onReset={reset}
        paused={paused}
        onTogglePlay={() => setPaused(p => !p)}
        toolbar={
          <>
            <Toggle label="pipeline" options={['Naive', 'Streamed']} value={pipeline}
                    onChange={v => { setPipeline(v); setUserDriving(true); }} />
            <button type="button"
              onPointerDown={() => { setUserDriving(true); run(); }}
              className="rounded-full border border-[var(--line-2)] px-3 py-1.5 font-mono text-[11px]
                         uppercase tracking-[.12em] text-[var(--text-md)] hover:text-[var(--text-hi)]
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-[var(--accent)]">
              Push to talk <span aria-hidden="true">(space)</span>
            </button>
            {hasSample && (
              <button type="button"
                onClick={() => new Audio('/media/hal-voice/hal-voice-sample.mp3').play()}
                className="rounded-full border border-[var(--line-2)] px-3 py-1.5 font-mono text-[11px]
                           uppercase tracking-[.12em] text-[var(--text-md)] hover:text-[var(--text-hi)]">
                Play the voice ⏵
              </button>
            )}
          </>
        }
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-4 pb-20">
          <canvas ref={canvasRef} className="h-[46%] w-full max-w-[46vh] flex-none" role="img"
                  aria-label={`HAL lens, state: ${state}`} style={{ aspectRatio: '1 / 1' }} />

          {/* transcript */}
          <p className="min-h-[3.2em] max-w-[52ch] text-center font-mono text-[12px] leading-relaxed text-[var(--text-md)]">
            {typed}<span className="text-[var(--tint)]">{state === 'speaking' ? '▍' : ''}</span>
          </p>

          {/* pipeline timeline */}
          <ol className="w-full max-w-[46rem] space-y-1">
            {spec.map(seg => (
              <li key={seg.label} className="grid grid-cols-[10rem_1fr] items-center gap-3">
                <span className="truncate font-mono text-[10px] uppercase tracking-[.1em] text-[var(--text-lo)]">
                  {seg.label}
                </span>
                <span className="relative block h-2 rounded-full bg-[rgba(255,255,255,0.05)]">
                  <span className="absolute inset-y-0 rounded-full"
                        style={{
                          left: `${(seg.start / total) * 100}%`,
                          width: `${(seg.len / total) * 100}%`,
                          background: 'audio' in seg && seg.audio ? TINT : 'rgba(255,255,255,0.22)',
                        }} />
                </span>
              </li>
            ))}
          </ol>
          <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[var(--text-lo)]">
            first audio at {firstAudio === null ? '—' : `${(firstAudio / 1000).toFixed(1)}s`} of {(total / 1000).toFixed(1)}s
          </p>
        </div>
      </DemoFrame>
    </div>
  );
}
