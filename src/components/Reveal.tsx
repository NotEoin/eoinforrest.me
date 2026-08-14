import { ReactNode } from 'react'
import { m, useReducedMotion } from 'framer-motion'

const supportsSDA =
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')

/**
 * Reveal-on-scroll for normal sections. Where CSS scroll-driven animation is
 * available the stylesheet handles it (.reveal-view under .sda); elsewhere a
 * Framer Motion whileInView branch takes over.
 */
export default function Reveal({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'figure' | 'header'
}) {
  const reduced = useReducedMotion()
  if (supportsSDA || reduced) {
    return <Tag className={`reveal-view ${className}`}>{children}</Tag>
  }
  const M = m[Tag]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </M>
  )
}
