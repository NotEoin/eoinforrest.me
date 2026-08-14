export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-14 focus:z-[70]
                 focus:border focus:border-[var(--line-2)] focus:bg-[var(--ink-100)] focus:px-4 focus:py-3
                 focus:font-mono focus:text-mono-label focus:uppercase focus:text-[var(--text-hi)]"
    >
      Skip to content
    </a>
  )
}
