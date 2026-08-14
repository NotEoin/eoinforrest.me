/** The four icons the site needs, as inline SVG. No icon library. */

interface IconProps {
  size?: number
  className?: string
}

export function ArrowUpRight({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <path d="M2.5 9.5 9.5 2.5M4 2.5h5.5V8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export function ArrowDown({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <path d="M6 1.5v9M2.5 7 6 10.5 9.5 7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export function Play({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <path d="M3 2.2v7.6L9.8 6 3 2.2Z" fill="currentColor" />
    </svg>
  )
}

export function Chevron({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <path d="M4 2.5 7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
