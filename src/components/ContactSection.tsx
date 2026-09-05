import { FormEvent, useState } from 'react'
import { GITHUB, LINKEDIN } from '../data/projects'
import { emailAddress, useMounted } from '../lib/email'

/**
 * The email renders click-to-reveal by default — it is assembled at click time
 * from parts, so scrapers reading the served HTML get nothing. Pass
 * obfuscate={false} for plain text. Since the site prerenders, every address
 * here is additionally gated on hydration (see components/Email) — otherwise
 * the build would write it into the static HTML in clear.
 *
 * The form posts to Formspree when VITE_FORMSPREE_ID is set in the deploy
 * environment. Without it there is no silent failure path: the form reveals the
 * address with a copy button instead, so Send always does something visible.
 *
 * The phone number is deliberately not here. It lives in the PDF CV only —
 * in-page it is just a line for address-harvesters to scrape.
 */
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID ?? ''

const email = emailAddress

function RevealEmail({ obfuscate = true }: { obfuscate?: boolean }) {
  const [shown, setShown] = useState(!obfuscate)
  if (!shown) {
    return (
      <button
        type="button"
        onClick={() => setShown(true)}
        className="m-0 cursor-pointer border-0 bg-transparent p-0 text-left text-[clamp(1.25rem,2.1vw,2rem)]
                   leading-[1.3] tracking-[-0.015em] text-[var(--text-hi)] underline decoration-[var(--line-2)]
                   underline-offset-4 hover:decoration-[var(--accent)]"
      >
        Email — click to reveal
      </button>
    )
  }
  return (
    <a
      href={`mailto:${email()}`}
      className="text-[clamp(1.25rem,2.1vw,2rem)] leading-[1.3] tracking-[-0.015em] text-[var(--text-hi)]
                 hover:text-[var(--accent)]"
    >
      {email()}
    </a>
  )
}

/** The no-Formspree path: the address, plainly, with one click to copy it. */
function CopyFallback() {
  const [copied, setCopied] = useState(false)
  const mounted = useMounted()
  // empty until hydrated, so the address never lands in the prerendered HTML
  const address = mounted ? email() : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      // clipboard is unavailable over http or when the permission is denied —
      // the address is on screen either way, so there is nothing to recover
      setCopied(false)
    }
  }

  return (
    <div className="grid gap-2.5 border border-[var(--line)] p-4">
      <p className="m-0 font-mono text-[11px] leading-[1.8] text-[var(--text-lo)]">
        The form isn’t wired up yet — send it here instead:
      </p>
      <p className="m-0 min-h-[1.5em] font-mono text-mono-data text-[var(--text-hi)] [overflow-wrap:anywhere]">
        {address}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} disabled={!mounted} className="btn btn-secondary">
          {copied ? 'Copied' : 'Copy address'}
        </button>
        <a href={mounted ? `mailto:${address}` : undefined} className="btn btn-secondary">Open mail app</a>
      </div>
    </div>
  )
}

export default function ContactSection({ obfuscate = true }: { obfuscate?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    setStatus('sending')
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      })
      if (!res.ok) throw new Error(String(res.status))
      setStatus('sent')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" data-nav="contact" className="px-[clamp(20px,4vw,72px)] py-[clamp(96px,12vh,180px)]">
      <p className="m-0 mb-[clamp(24px,4vh,40px)] font-mono text-mono-label uppercase text-[var(--text-lo)]">
        // Get in touch
      </p>
      <div className="grid items-start gap-[clamp(32px,5vw,80px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,30ch),1fr))]">
        <div>
          <p className="m-0"><RevealEmail obfuscate={obfuscate} /></p>
          <p className="m-0 mt-3 font-mono text-mono-data leading-[2] text-[var(--text-md)]">
            <a href={LINKEDIN} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">
              LinkedIn — /in/eoin-forrest
            </a>
            <br />
            <a href={GITHUB} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">
              GitHub — @NotEoin
            </a>
          </p>
          <p className="m-0 mt-5 max-w-[44ch] font-mono text-[11px] leading-[1.8] text-[var(--text-lo)]">
            London / Newcastle · open to relocation · UK &amp; Irish citizen, no sponsorship required
          </p>
        </div>

        {FORMSPREE_ID ? (
          <form onSubmit={onSubmit} className="grid max-w-[44ch] gap-2.5" aria-label="Send a message">
            <input name="name" required aria-label="Your name" placeholder="Name" className="field" />
            <input name="email" required type="email" aria-label="Your email" placeholder="Email" className="field" />
            <textarea name="message" required aria-label="Message" placeholder="Message" rows={4} className="field resize-y" />
            <button type="submit" disabled={status === 'sending'} className="btn btn-primary justify-self-start">
              <span aria-hidden="true" className="text-[var(--accent)]">▍</span>
              {status === 'sending' ? 'Sending…' : 'Send'}
            </button>
            <p role="status" aria-live="polite" className="m-0 min-h-[1.2em] font-mono text-[11px] text-[var(--text-lo)]">
              {status === 'sent' && 'Sent — thank you. I read everything.'}
              {status === 'error' && "That didn't send. Email me directly instead."}
            </p>
          </form>
        ) : (
          <div className="max-w-[44ch]"><CopyFallback /></div>
        )}
      </div>
    </section>
  )
}
