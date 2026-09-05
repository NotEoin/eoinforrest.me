import { ReactNode, useEffect, useRef, useState } from 'react'

/** Mounts children only once the wrapper comes within `margin` of the
 *  viewport — the demos stay out of the bundle and off the main thread
 *  until a reader is nearly there. */
export default function LazyMount({
  children,
  margin = '200px',
  minHeight = 420,
}: {
  children: ReactNode
  margin?: string
  minHeight?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || mounted) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
      },
      { rootMargin: margin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin, mounted])

  return (
    <div ref={ref} style={mounted ? undefined : { minHeight }}>
      {mounted ? children : null}
    </div>
  )
}
