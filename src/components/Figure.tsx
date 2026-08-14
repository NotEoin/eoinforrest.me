import { useState } from 'react'
import Placeholder from './Placeholder'

/** A figure with a mono caption; falls back to the striped Placeholder when
 *  the file is missing, at the same path and ratio. */
export default function Figure({
  src,
  ratio,
  alt,
  caption,
  tint,
  maxWidth,
  size,
}: {
  src: string
  ratio: string
  alt: string
  caption: string
  tint?: string
  maxWidth?: string
  size?: string
}) {
  const [failed, setFailed] = useState(false)
  return (
    <figure className="m-0 my-8" style={maxWidth ? { maxWidth } : undefined}>
      {failed ? (
        <Placeholder id={`fig-${src}`} ratio={ratio} label={alt.toUpperCase()} file={src} size={size} tint={tint} />
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full rounded-[20px] border border-[var(--line)]"
          style={{ aspectRatio: ratio.replace('/', ' / '), objectFit: 'cover' }}
          onError={() => setFailed(true)}
        />
      )}
      <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">
        {caption}
      </figcaption>
    </figure>
  )
}
