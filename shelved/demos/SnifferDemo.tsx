import { useCallback, useEffect, useRef, useState } from 'react';
import DemoFrame, { Slider, Toggle, useInView, usePrefersReducedMotion } from '../components/DemoFrame';

/**
 * SnifferDemo — MAC randomisation vs IE fingerprinting.
 *
 * A simulated room of phones, each rotating a randomised, locally-administered
 * MAC on its own timer and each carrying a chipset/driver IE fingerprint.
 * Two counters run over the same synthetic capture:
 *   raw unique MACs        — climbs for as long as you keep listening
 *   fingerprint clusters   — tracks the real number of people
 * The demo also shows the floor of the technique: two identical handsets
 * fingerprint alike and merge into one cluster. That undercount is inherent.
 */

const TINT = 'oklch(0.80 0.13 220)';
const RAW = 'oklch(0.80 0.13 92)';
const WINDOW_MS = 30_000;            // sliding window, compressed for the demo
const CHIPSETS = [
  'ht:0x011c,ext:0x0400,rates:12-18-24-36-48-54',
  'ht:0x016e,ext:0x0800,rates:6-9-12-18-24-36',
  'vht:0x0f39,ext:0x0c00,rates:12-24-48-54',
  'ht:0x01ac,ext:0x0400,rates:6-12-24-54',
];

type Phone = { id: number; chipset: number; mac: string; nextRotate: number; period: number };
type Probe = { t: number; mac: string; fp: number; local: boolean };

function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randomLocalMac = (rnd: () => number) => {
  // locally administered: bit 1 of the first octet set
  const first = (0x02 | (Math.floor(rnd() * 64) << 2)) & 0xfe;
  const oct = [first, ...Array.from({ length: 5 }, () => Math.floor(rnd() * 256))];
  return oct.map(o => o.toString(16).padStart(2, '0')).join(':');
};

export default function SnifferDemo() {
  const { ref: hostRef, inView } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const chartRef = useRef<HTMLCanvasElement>(null);

  const [people, setPeople] = useState(6);
  const [rotateSec, setRotateSec] = useState(20);
  const [clustering, setClustering] = useState<0 | 1>(0);   // 0 = on, 1 = off
  const [speed, setSpeed] = useState<0 | 1>(0);             // 0 = x1, 1 = x4
  const [paused, setPaused] = useState(false);
  const [log, setLog] = useState<Probe[]>([]);
  const [stats, setStats] = useState({ raw: 0, clusters: 0, truth: 0, err: 0, collisions: 0 });

  const rnd = useRef(mulberry(20260814));
  const phones = useRef<Phone[]>([]);
  const probes = useRef<Probe[]>([]);
  const series = useRef<{ t: number; raw: number; clustered: number; truth: number }[]>([]);
  const clock = useRef(0);

  const build = useCallback((n: number) => {
    rnd.current = mulberry(20260814 + n);
    phones.current = Array.from({ length: n }, (_, i) => ({
      id: i,
      // deliberately let two phones share a chipset once there are 5+ people
      chipset: i === 4 ? 0 : i % CHIPSETS.length,
      mac: randomLocalMac(rnd.current),
      period: (rotateSec + Math.floor(rnd.current() * 8) - 4) * 1000,
      nextRotate: 1500 + rnd.current() * 4000,
    }));
    probes.current = [];
    series.current = [];
    clock.current = 0;
    setLog([]);
  }, [rotateSec]);

  useEffect(() => build(people), [people, build]);

  const reset = useCallback(() => { build(people); setPaused(false); }, [build, people]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (inView && e.key.toLowerCase() === 'r') reset(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inView, reset]);

  /* ------------------------------------------------------------------- engine */
  useEffect(() => {
    let raf = 0, last = performance.now();
    const canvas = chartRef.current;
    const ctx = canvas?.getContext('2d') ?? null;

    const resize = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = canvas ? new ResizeObserver(resize) : null;
    if (canvas && ro) ro.observe(canvas);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(50, now - last) * (speed ? 4 : 1); last = now;
      if (!inView || paused || reduced) { draw(); return; }
      clock.current += dt;
      const t = clock.current;
      const r = rnd.current;

      for (const p of phones.current) {
        if (t > p.nextRotate) {
          p.mac = randomLocalMac(r);
          p.nextRotate = t + p.period * (0.75 + r() * 0.5);
        }
        // probe bursts: a phone emits every ~1.2s of demo time
        if (r() < dt / 1200) {
          const probe: Probe = { t, mac: p.mac, fp: p.chipset, local: true };
          probes.current.push(probe);
          setLog(l => [probe, ...l].slice(0, 14));
        }
      }

      // sliding window with lazy expiry
      probes.current = probes.current.filter(p => t - p.t < WINDOW_MS);
      const rawSet = new Set(probes.current.map(p => p.mac));
      // cluster key: the MAC when it looks universally administered, the IE
      // fingerprint when it is locally administered
      const clusterSet = new Set(
        probes.current.map(p => (clustering === 0 && p.local ? `fp:${p.fp}` : p.mac))
      );
      const truth = phones.current.length;
      const chipCounts = new Map<number, number>();
      phones.current.forEach(p => chipCounts.set(p.chipset, (chipCounts.get(p.chipset) ?? 0) + 1));
      const collisions = [...chipCounts.values()].reduce((a, c) => a + (c > 1 ? c - 1 : 0), 0);

      setStats({
        raw: rawSet.size,
        clusters: clusterSet.size,
        truth,
        err: truth ? Math.round(((clusterSet.size - truth) / truth) * 100) : 0,
        collisions,
      });

      series.current.push({ t, raw: rawSet.size, clustered: clusterSet.size, truth });
      if (series.current.length > 600) series.current.shift();
      draw();
    };

    function draw() {
      if (!canvas || !ctx) return;
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      const pts = series.current;
      if (!pts.length) return;
      const maxY = Math.max(12, ...pts.map(p => p.raw)) * 1.15;
      const X = (i: number) => (i / Math.max(1, pts.length - 1)) * (r.width - 8) + 4;
      const Y = (v: number) => r.height - 10 - (v / maxY) * (r.height - 24);

      // hairline grid
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      for (let g = 0; g <= 4; g++) {
        const y = 10 + (g / 4) * (r.height - 24);
        ctx.beginPath(); ctx.moveTo(4, y); ctx.lineTo(r.width - 4, y); ctx.stroke();
      }

      const line = (get: (p: typeof pts[0]) => number, colour: string, dash?: number[]) => {
        ctx.strokeStyle = colour; ctx.lineWidth = 1.5;
        ctx.setLineDash(dash ?? []);
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(X(i), Y(get(p))) : ctx.moveTo(X(i), Y(get(p)))));
        ctx.stroke();
        ctx.setLineDash([]);
      };
      line(p => p.truth, 'rgba(255,255,255,0.45)', [3, 4]);
      line(p => p.raw, RAW);
      line(p => p.clustered, TINT);
    }

    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); };
  }, [inView, paused, reduced, speed, clustering]);

  return (
    <div ref={hostRef}>
      <DemoFrame
        title="Probe request sniffer — counting through MAC randomisation"
        tint={TINT}
        explains="Every phone in the simulated room rotates a randomised MAC on its own timer, and each carries the information-element fingerprint of its chipset and driver. Raw MAC counting climbs for as long as you keep listening; keying on the IE fingerprint instead collapses one phone's twenty addresses back to one device. Turn clustering off to see the naive count run away — and note the collisions line: two identical handsets fingerprint alike and merge into one."
        alternative="A simulation comparing two ways of counting nearby devices from 802.11 probe requests. Counting unique MAC addresses produces a number that climbs indefinitely because phones rotate randomised addresses; clustering on the information-element fingerprint tracks the true number of people, except where two identical handsets share a fingerprint and merge."
        readout={{
          'raw MACs': stats.raw,
          clusters: stats.clusters,
          'true count': stats.truth,
          error: `${stats.err > 0 ? '+' : ''}${stats.err}%`,
          collisions: stats.collisions,
        }}
        onReset={reset}
        paused={paused}
        onTogglePlay={() => setPaused(p => !p)}
        toolbar={
          <>
            <Slider label="people" value={people} min={1} max={20} onChange={setPeople} />
            <Slider label="rotate" value={rotateSec} min={5} max={60} suffix="s" onChange={setRotateSec} />
            <Toggle label="clustering" options={['On', 'Off']} value={clustering} onChange={setClustering} />
            <Toggle label="time" options={['×1', '×4']} value={speed} onChange={setSpeed} />
          </>
        }
      >
        <div className="absolute inset-0 grid grid-cols-1 gap-3 p-4 pb-20 md:grid-cols-[minmax(0,22rem)_1fr]">
          {/* probe log */}
          <div className="hidden min-h-0 flex-col overflow-hidden md:flex">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">
              // probe requests
            </p>
            <ul className="min-h-0 flex-1 space-y-1 overflow-hidden font-mono text-[11px] leading-relaxed">
              {log.map((p, i) => (
                <li key={`${p.mac}-${p.t}-${i}`}
                    style={{ opacity: 1 - i * 0.06 }}
                    className="flex justify-between gap-3 text-[var(--text-md)]">
                  <span className="text-[var(--text-hi)]">{p.mac}</span>
                  <span className="text-[var(--text-lo)]">
                    {clustering === 0 ? `fp #${p.fp}` : 'local'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* chart */}
          <div className="relative min-h-0">
            <p className="mb-2 flex flex-wrap gap-x-4 font-mono text-[11px] uppercase tracking-[.12em]">
              <span style={{ color: RAW }}>— raw MAC count</span>
              <span style={{ color: TINT }}>— clustered devices</span>
              <span className="text-[var(--text-lo)]">-- true headcount</span>
            </p>
            <canvas ref={chartRef} className="h-[calc(100%-1.75rem)] w-full" role="img"
                    aria-label="Chart of raw MAC count, clustered device count and true headcount over time" />
          </div>
        </div>
      </DemoFrame>
    </div>
  );
}
