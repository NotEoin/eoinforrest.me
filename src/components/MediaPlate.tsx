import { useEffect, useRef, useState } from 'react'
import { PlateMedia } from '../data/projects'
import Placeholder from './Placeholder'
import { Play } from './Icons'

/**
 * The media frame. Accepts image or video; when the file is missing it falls
 * back to the striped Placeholder at the same path and ratio, so swapping the
 * real asset in needs no layout change.
 *
 * Decorative plate video: muted, playsInline, loop, poster, aria-hidden.
 * Under prefers-reduced-motion the poster ships with a visible play control.
 */
export default function MediaPlate({
  media,
  tint,
  fill = false,
  className = '',
}: {
  media: PlateMedia
  tint: string
  /** act plates fill their sticky container edge-to-edge */
  fill?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [reduced, setReduced] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // autoplay only while on screen, and never under reduced motion
  useEffect(() => {
    if (media.kind !== 'video' || failed || reduced) return
    const host = hostRef.current
    const video = videoRef.current
    if (!host || !video) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(() => setPlaying(true)).catch(() => setFailed(false))
        } else {
          video.pause()
        }
      },
      { rootMargin: '80px' }
    )
    io.observe(host)
    return () => io.disconnect()
  }, [media, failed, reduced])

  const ratio = `${media.width}/${media.height}`

  if (failed) {
    return (
      <div ref={hostRef} className={fill ? 'absolute inset-0' : className}>
        <Placeholder
          id={`plate-${media.src ?? media.label}`}
          ratio={ratio}
          label={media.label}
          file={media.src ?? ''}
          size={`${media.width}×${media.height}`}
          tint={tint}
          fill={fill}
          className={fill ? '' : className}
        />
      </div>
    )
  }

  const frame = fill
    ? 'absolute inset-0 h-full w-full'
    : `relative overflow-hidden rounded-[20px] border border-[var(--line)] ${className}`

  return (
    <div ref={hostRef} className={frame} style={fill ? undefined : { aspectRatio: ratio.replace('/', ' / ') }}>
      {media.kind === 'image' && (
        <img
          src={media.src}
          alt=""
          aria-hidden="true"
          width={media.width}
          height={media.height}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
      {media.kind === 'video' && (
        <>
          <video
            ref={videoRef}
            muted
            playsInline
            loop
            preload="none"
            poster={media.poster}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setFailed(true)}
          >
            {media.webm && <source src={media.webm} type="video/webm" />}
            {media.src && <source src={media.src} type="video/mp4" />}
          </video>
          {reduced && !playing && (
            <button
              type="button"
              onClick={() => {
                videoRef.current?.play()
                setPlaying(true)
              }}
              className="liquid-glass absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full px-3 py-2
                         font-mono text-[10px] uppercase tracking-[.12em] text-[var(--text-hi)]"
            >
              <Play /> Play
            </button>
          )}
        </>
      )}
      {/* 4% tint wash at the base for the legibility of anything overlaid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(0deg, color-mix(in oklab, ${tint} 4%, transparent), transparent 60%)`,
        }}
      />
    </div>
  )
}
