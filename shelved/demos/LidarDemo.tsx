import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DemoFrame, { Slider, Toggle, useInView, usePrefersReducedMotion } from '../components/DemoFrame';

/**
 * LidarDemo — the real pipeline, in the browser:
 *   occupancy grid -> tick-budgeted A* (octile heuristic, clearance penalty,
 *   pinched-diagonal rejection) -> corridor polyline -> pure pursuit with
 *   speed-scaled look-ahead.
 *
 * Drag on the stage to paint obstacles. The boat replans while moving.
 * Deterministic: same seed, same first frame, every visit.
 */

const COLS = 56, ROWS = 34, CELL = 1;         // grid units; canvas scales to fit
const TINT = 'oklch(0.82 0.15 150)';
const AMBER = 'oklch(0.80 0.13 92)';
const SEARCH_BUDGET = 220;                     // nodes per simulated tick

type Pt = { x: number; y: number };
const key = (x: number, y: number) => `${x},${y}`;

/* ---------------------------------------------------------------- seeded map */
function seededObstacles(): Set<string> {
  const s = new Set<string>();
  let seed = 20260814;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  // three rock clusters + one channel with a diagonal pinch (the corner-cutting case)
  const blobs: Pt[] = [{ x: 18, y: 10 }, { x: 26, y: 22 }, { x: 38, y: 14 }];
  for (const b of blobs) {
    const n = 14 + Math.floor(rnd() * 8);
    for (let i = 0; i < n; i++) {
      const x = b.x + Math.round((rnd() - 0.5) * 7);
      const y = b.y + Math.round((rnd() - 0.5) * 7);
      if (x > 1 && y > 1 && x < COLS - 2 && y < ROWS - 2) s.add(key(x, y));
    }
  }
  // the pinch: two rocks meeting at a diagonal
  s.add(key(32, 8)); s.add(key(33, 9)); s.add(key(33, 7)); s.add(key(32, 10));
  return s;
}

/* ------------------------------------------------------------------ A* search */
interface SearchResult { path: Pt[]; expanded: number; }

function astar(
  start: Pt, goal: Pt, obs: Set<string>,
  opts: { octile: boolean; allowCornerCut: boolean; clearanceWeight: number }
): SearchResult {
  const h = (a: Pt) => {
    const dx = Math.abs(a.x - goal.x), dy = Math.abs(a.y - goal.y);
    return opts.octile
      ? (dx + dy) + (1.4 - 2) * Math.min(dx, dy)      // octile: exact on an 8-grid
      : Math.hypot(dx, dy);                            // euclidean: admissible but loose
  };
  const blocked = (x: number, y: number) =>
    x < 1 || y < 1 || x > COLS - 2 || y > ROWS - 2 || obs.has(key(x, y));

  // clearance: how close a cell sits to an obstacle, within radius 2
  const clearance = (x: number, y: number) => {
    let p = 0;
    for (let dx = -2; dx <= 2; dx++)
      for (let dy = -2; dy <= 2; dy++)
        if (obs.has(key(x + dx, y + dy))) p += 1 / (1 + Math.abs(dx) + Math.abs(dy));
    return p;
  };

  const open = new Map<string, { pt: Pt; g: number; f: number }>();
  const from = new Map<string, string>();
  const gScore = new Map<string, number>();
  const closed = new Set<string>();
  const sK = key(start.x, start.y);
  open.set(sK, { pt: start, g: 0, f: h(start) });
  gScore.set(sK, 0);
  let expanded = 0;

  while (open.size) {
    let bestK = '', best = Infinity;
    for (const [k, v] of open) if (v.f < best) { best = v.f; bestK = k; }
    const cur = open.get(bestK)!;
    open.delete(bestK);
    if (closed.has(bestK)) continue;
    closed.add(bestK);
    expanded++;
    if (expanded > 6000) break;

    if (cur.pt.x === goal.x && cur.pt.y === goal.y) {
      const path: Pt[] = [];
      let k: string | undefined = bestK;
      while (k) {
        const [x, y] = k.split(',').map(Number);
        path.unshift({ x, y });
        k = from.get(k);
      }
      return { path, expanded };
    }

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const nx = cur.pt.x + dx, ny = cur.pt.y + dy;
        if (blocked(nx, ny)) continue;
        // a diagonal hop is "pinched" if either flanking orthogonal cell is occupied
        if (dx && dy && !opts.allowCornerCut &&
            (blocked(cur.pt.x + dx, cur.pt.y) || blocked(cur.pt.x, cur.pt.y + dy))) continue;
        const step = dx && dy ? 1.4 : 1;
        const nK = key(nx, ny);
        const g = cur.g + step + opts.clearanceWeight * clearance(nx, ny);
        if (g < (gScore.get(nK) ?? Infinity)) {
          gScore.set(nK, g);
          from.set(nK, bestK);
          open.set(nK, { pt: { x: nx, y: ny }, g, f: g + h({ x: nx, y: ny }) });
        }
      }
    }
  }
  return { path: [], expanded };
}

/* --------------------------------------------------------------- the component */
export default function LidarDemo() {
  const { ref: hostRef, inView } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [obs, setObs] = useState<Set<string>>(() => seededObstacles());
  const [goal, setGoal] = useState<Pt>({ x: COLS - 6, y: ROWS - 6 });
  const [octile, setOctile] = useState<0 | 1>(0);          // 0 = octile, 1 = euclidean
  const [cornerCut, setCornerCut] = useState<0 | 1>(0);    // 0 = rejected, 1 = allowed
  const [clearanceWeight, setClearanceWeight] = useState(6);
  const [lookAhead, setLookAhead] = useState(5);
  const [userDriving, setUserDriving] = useState(false);
  const [paused, setPaused] = useState(false);

  const boat = useRef({ x: 6, y: 6, hdg: 0.4, spd: 0 });
  const ghost = useRef<Pt[]>([]);
  const [stats, setStats] = useState({ expanded: 0, ticks: 0, len: 0, xte: 0 });
  const pathRef = useRef<Pt[]>([]);
  const paintingRef = useRef(false);

  const opts = useMemo(() => ({
    octile: octile === 0,
    allowCornerCut: cornerCut === 1,
    clearanceWeight: clearanceWeight / 10,
  }), [octile, cornerCut, clearanceWeight]);

  const replan = useCallback(() => {
    const b = boat.current;
    const res = astar({ x: Math.round(b.x), y: Math.round(b.y) }, goal, obs, opts);
    pathRef.current = res.path;
    setStats(s => ({
      ...s,
      expanded: res.expanded,
      ticks: Math.max(1, Math.ceil(res.expanded / SEARCH_BUDGET)),
      len: Math.round(res.path.length * CELL),
    }));
  }, [goal, obs, opts]);

  useEffect(replan, [replan]);

  const reset = useCallback(() => {
    boat.current = { x: 6, y: 6, hdg: 0.4, spd: 0 };
    ghost.current = [];
    setObs(seededObstacles());
    setGoal({ x: COLS - 6, y: ROWS - 6 });
    setUserDriving(false);
  }, []);

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!inView) return;
      const k = e.key.toLowerCase();
      if (k === 'r') reset();
      else if (k === 'o') { setOctile(v => (v ? 0 : 1)); setUserDriving(true); }
      else if (k === 'c') { setCornerCut(v => (v ? 0 : 1)); setUserDriving(true); }
      else if (k.startsWith('arrow')) {
        e.preventDefault();
        setUserDriving(true);
        setGoal(g => ({
          x: Math.min(COLS - 2, Math.max(1, g.x + (k === 'arrowright' ? 1 : k === 'arrowleft' ? -1 : 0))),
          y: Math.min(ROWS - 2, Math.max(1, g.y + (k === 'arrowdown' ? 1 : k === 'arrowup' ? -1 : 0))),
        }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inView, reset]);

  /* ------------------------------------------------------------- render loop */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0, last = performance.now(), acc = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(48, now - last); last = now;
      const r = canvas.getBoundingClientRect();
      const sx = r.width / COLS, sy = r.height / ROWS;
      const running = inView && !paused && !reduced;

      /* --- pure pursuit ------------------------------------------------- */
      if (running) {
        acc += dt;
        while (acc > 16) {
          acc -= 16;
          const b = boat.current;
          const path = pathRef.current;
          if (path.length > 1) {
            // project onto the polyline, then take a carrot look-ahead further along
            let bestI = 0, bestD = Infinity;
            for (let i = 0; i < path.length; i++) {
              const d = (path[i].x - b.x) ** 2 + (path[i].y - b.y) ** 2;
              if (d < bestD) { bestD = d; bestI = i; }
            }
            const speedFactor = 0.4 + (b.spd / 0.14) * 0.6;   // look-ahead scales with speed
            const carrotI = Math.min(path.length - 1, bestI + Math.round(lookAhead * speedFactor));
            const carrot = path[carrotI];
            const want = Math.atan2(carrot.y - b.y, carrot.x - b.x);
            const diff = ((want - b.hdg + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            b.hdg += Math.max(-0.035, Math.min(0.035, diff * 0.12));
            const turnPenalty = 1 - Math.min(0.6, Math.abs(diff) * 0.5);
            b.spd += (0.14 * turnPenalty - b.spd) * 0.03;
            b.x += Math.cos(b.hdg) * b.spd;
            b.y += Math.sin(b.hdg) * b.spd;
            ghost.current.push({ x: b.x, y: b.y });
            if (ghost.current.length > 220) ghost.current.shift();
            setStats(s => ({ ...s, xte: Math.round(Math.sqrt(bestD) * 10) / 10 }));
            if (Math.hypot(goal.x - b.x, goal.y - b.y) < 1.2) {
              b.x = 6; b.y = 6; b.hdg = 0.4; b.spd = 0; ghost.current = [];
            }
            if (bestI > 2) replan();
          }
        }
      }

      /* --- draw --------------------------------------------------------- */
      ctx.clearRect(0, 0, r.width, r.height);
      ctx.fillStyle = 'oklch(0.11 0.006 264)';
      ctx.fillRect(0, 0, r.width, r.height);

      // grid dots
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let x = 0; x < COLS; x += 2)
        for (let y = 0; y < ROWS; y += 2) ctx.fillRect(x * sx, y * sy, 1, 1);

      // obstacle cells
      ctx.fillStyle = AMBER;
      ctx.globalAlpha = 0.55;
      obs.forEach(k => {
        const [x, y] = k.split(',').map(Number);
        ctx.fillRect(x * sx, y * sy, sx - 1, sy - 1);
      });
      ctx.globalAlpha = 1;

      // ghost track
      if (ghost.current.length > 2) {
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath();
        ghost.current.forEach((p, i) => i ? ctx.lineTo(p.x * sx, p.y * sy) : ctx.moveTo(p.x * sx, p.y * sy));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // corridor
      const path = pathRef.current;
      if (path.length > 1) {
        ctx.strokeStyle = TINT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        path.forEach((p, i) => i
          ? ctx.lineTo((p.x + 0.5) * sx, (p.y + 0.5) * sy)
          : ctx.moveTo((p.x + 0.5) * sx, (p.y + 0.5) * sy));
        ctx.stroke();
      }

      // goal
      ctx.strokeStyle = TINT;
      ctx.strokeRect((goal.x - 0.5) * sx, (goal.y - 0.5) * sy, sx * 2, sy * 2);

      // vehicle
      const b = boat.current;
      ctx.save();
      ctx.translate((b.x + 0.5) * sx, (b.y + 0.5) * sy);
      ctx.rotate(b.hdg);
      ctx.fillStyle = '#f5f6f7';
      ctx.beginPath();
      ctx.moveTo(sx * 1.1, 0); ctx.lineTo(-sx * 0.7, sy * 0.6); ctx.lineTo(-sx * 0.7, -sy * 0.6);
      ctx.closePath(); ctx.fill();
      ctx.restore();

      // three beams (cosmetic, body-frame — they stay level with the hull)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      for (const a of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo((b.x + 0.5) * sx, (b.y + 0.5) * sy);
        ctx.lineTo((b.x + Math.cos(b.hdg + a) * 9) * sx, (b.y + Math.sin(b.hdg + a) * 9) * sy);
        ctx.stroke();
      }
    };

    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [inView, paused, reduced, obs, goal, lookAhead, replan]);

  /* ------------------------------------------------------------ obstacle paint */
  const paint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * COLS);
    const y = Math.floor(((e.clientY - r.top) / r.height) * ROWS);
    setUserDriving(true);
    setObs(prev => {
      const next = new Set(prev);
      if (e.shiftKey) next.delete(key(x, y)); else next.add(key(x, y));
      return next;
    });
  };

  return (
    <div ref={hostRef}>
      <DemoFrame
        title="Lidar autonavigation — A* replanning and pure pursuit"
        tint={TINT}
        explains="The boat maps obstacles, plans with a tick-budgeted A* using an octile heuristic and a clearance penalty, then follows the corridor with pure pursuit — aiming at a carrot point further along the route rather than at the next node. Drag to paint obstacles (shift-drag erases). Switch the heuristic and watch 'nodes expanded' change for the same path; allow corner-cutting and watch it clip a diagonal gap."
        alternative="An interactive reconstruction of the Lidar autopilot: an occupancy grid with an A* search whose heuristic and corner-cutting rules can be switched, and a pure-pursuit controller steering along the resulting corridor. The readout compares nodes expanded between the octile and Euclidean heuristics."
        readout={{
          'nodes expanded': stats.expanded,
          'search ticks': stats.ticks,
          'path cells': stats.len,
          'cross-track': `${stats.xte}`,
          mode: userDriving ? 'you are driving' : 'auto',
        }}
        onReset={reset}
        paused={paused}
        onTogglePlay={() => setPaused(p => !p)}
        toolbar={
          <>
            <Toggle label="heuristic" options={['Octile', 'Euclidean']} value={octile}
                    onChange={v => { setOctile(v); setUserDriving(true); }} />
            <Toggle label="diagonals" options={['Rejected', 'Allowed']} value={cornerCut}
                    onChange={v => { setCornerCut(v); setUserDriving(true); }} />
            <Slider label="clearance" value={clearanceWeight} min={0} max={20}
                    onChange={v => { setClearanceWeight(v); setUserDriving(true); }} />
            <Slider label="look-ahead" value={lookAhead} min={1} max={12}
                    onChange={v => { setLookAhead(v); setUserDriving(true); }} />
          </>
        }
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={e => { paintingRef.current = true; paint(e); }}
          onPointerMove={e => { if (paintingRef.current) paint(e); }}
          onPointerUp={() => { paintingRef.current = false; }}
          onPointerLeave={() => { paintingRef.current = false; }}
          aria-label="Debug map: obstacle grid, A* corridor, ghost track and the vehicle"
          role="img"
        />
        <p className="pointer-events-none absolute left-4 top-4 max-w-[24ch] font-mono text-[11px]
                      uppercase tracking-[.12em] text-[var(--text-lo)]">
          drag to paint obstacles · shift-drag erases · arrows move the goal
        </p>
      </DemoFrame>
    </div>
  );
}
