import { useEffect, useRef } from 'react'

const supportsSDA =
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll(root)')

/** 1px accent hairline on the nav's lower edge. CSS scroll-driven where
 *  supported; a rAF-throttled transform elsewhere. */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (supportsSDA) return
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      el.style.transform = `scaleX(${max > 0 ? doc.scrollTop / max : 0})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`scroll-progress ${supportsSDA ? 'scroll-progress--css' : ''}`}
      style={supportsSDA ? undefined : { transform: 'scaleX(0)' }}
    />
  )
}
