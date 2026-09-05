import { emailAddress, useMounted } from '../lib/email'

/** The address as a mailto link, rendered only after hydration so it never
 *  lands in the prerendered HTML. Reserves its line until then. */
export function EmailLink({ className }: { className?: string }) {
  const mounted = useMounted()
  if (!mounted) return <span className={className} aria-hidden="true">&nbsp;</span>
  return (
    <a href={`mailto:${emailAddress()}`} className={className}>
      {emailAddress()}
    </a>
  )
}

/** The address as plain text — for the print-only CV header. */
export function EmailText() {
  const mounted = useMounted()
  return <>{mounted ? emailAddress() : ' '}</>
}
