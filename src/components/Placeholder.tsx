interface PlaceholderProps {
  id: string
  /** aspect ratio, e.g. "16/9" */
  ratio: string
  label: string
  file: string
  /** expected pixel size, e.g. "1920×1080" */
  size?: string
  tint?: string
  className?: string
  /** fill the parent instead of declaring an aspect ratio */
  fill?: boolean
}

/**
 * Every unbuilt asset renders as this — never a grey box, never lorem, never
 * a stock photo. Same path and ratio as the real file, so the swap needs no
 * layout change and CLS stays 0.
 */
export default function Placeholder({
  id, ratio, label, file, size, tint = 'transparent', className = '', fill = false,
}: PlaceholderProps) {
  return (
    <figure
      id={id}
      className={`m-0 grid place-items-center overflow-hidden border border-[var(--line)] ${fill ? 'absolute inset-0 h-full w-full rounded-none border-0' : 'relative rounded-[20px]'} ${className}`}
      style={{
        aspectRatio: fill ? undefined : ratio.replace('/', ' / '),
        backgroundColor: 'var(--ink-050)',
        backgroundImage: `linear-gradient(color-mix(in oklab, ${tint} 3%, transparent), color-mix(in oklab, ${tint} 3%, transparent)),
          repeating-linear-gradient(45deg, rgba(255,255,255,.05) 0 1px, transparent 1px 8px)`,
      }}
    >
      <span
        className="absolute left-2.5 top-2.5 border border-[var(--line-2)] px-2 py-1 font-mono text-[9.5px]
                   uppercase tracking-[.12em] text-[var(--text-lo)]"
      >
        Placeholder
      </span>
      <figcaption className="px-4 text-center font-mono text-[11px] leading-[1.7] text-[var(--text-lo)]">
        {label}
        <br />
        {file}
        {size ? (
          <>
            <br />
            {size}
          </>
        ) : null}
      </figcaption>
    </figure>
  )
}
