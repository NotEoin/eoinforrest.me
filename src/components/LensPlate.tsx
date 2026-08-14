import { useEffect, useRef, useState } from 'react'

type LensState = 'idle' | 'listening' | 'thinking' | 'speaking'
const CYCLE: LensState[] = ['idle', 'listening', 'thinking', 'speaking']

/**
 * The act-04 plate: the hal-voice lens rendered live, not an image.
 * A web port of the repo's ui_eye.py — concentric bezel rings, an additive
 * red glow built from 18 fading rings, lens core, hot centre and an offset
 * specular highlight — driven by the source's exact per-state intensity
 * functions. Cycles states on its own while visible.
 */
export default function LensPlate() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<LensState>('idle')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let visible = false
    let raf = 0
    let level = 0
    let cycleAt = 0
    let current: LensState = 'idle'

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '80px' })
    io.observe(canvas)

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (!visible) return
      const t = now / 1000
      if (!reduced && now - cycleAt > 3200) {
        cycleAt = now
        current = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]
        setState(current)
      }
      if (current === 'speaking') {
        level = 0.28 * (0.6 + 0.4 * Math.sin(t * 11)) * (0.5 + 0.5 * Math.sin(t * 2.7))
      } else {
        level *= 0.9
      }
      // intensity(state, t) ported verbatim from ui_eye.py
      const k = reduced ? 0.55
        : current === 'listening' ? 1
        : current === 'thinking' ? 0.55 + 0.18 * Math.sin(7 * t) * Math.sin(2.3 * t)
        : current === 'speaking' ? Math.min(1, Math.max(0.35, 0.45 + level))
        : 0.30 + 0.10 * (Math.sin(1.2 * t) * 0.5 + 0.5)

      const W = canvas.width
      const cx = W / 2
      const cy = W / 2
      const R = W * 0.4
      ctx.clearRect(0, 0, W, W)
      ctx.lineWidth = 2
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.1 - i * 0.018})`
        ctx.beginPath()
        ctx.arc(cx, cy, R * (1 + i * 0.06), 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 18; i >= 1; i--) {
        const f = i / 18
        ctx.fillStyle = `rgba(220,30,20,${0.055 * k * Math.pow(1 - f, 1.4)})`
        ctx.beginPath()
        ctx.arc(cx, cy, R * 0.82 * f + R * 0.12, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = `rgba(220,30,20,${0.55 + 0.4 * k})`
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(255,180,150,${0.35 + 0.5 * k})`
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(255,255,255,0.16)'
      ctx.beginPath()
      ctx.ellipse(cx - R * 0.22, cy - R * 0.26, R * 0.13, R * 0.07, -0.5, 0, Math.PI * 2)
      ctx.fill()
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        width={900}
        height={900}
        aria-hidden="true"
        className="act-fade absolute left-[clamp(-6vw,2vw,6vw)] top-1/2 w-[min(56vh,44vw)] [translate:0_-50%]
                   max-md:relative max-md:left-auto max-md:top-auto max-md:mx-auto max-md:w-[min(46vh,80vw)]
                   max-md:[translate:none]"
        style={{ aspectRatio: '1 / 1' }}
      />
      <p
        aria-live="off"
        className="absolute bottom-[clamp(40px,6vh,72px)] left-[clamp(20px,4vw,72px)] m-0 font-mono
                   text-[11px] uppercase tracking-[.12em] text-[var(--tint-halvoice)] max-md:hidden"
      >
        state — {state}
      </p>
    </>
  )
}
