import { FormEvent, useState } from 'react'
import { GITHUB, LINKEDIN } from '../data/projects'

/**
 * Contact details render click-to-reveal by default — the mailto:/tel: is
 * assembled at click time from parts, so scrapers get nothing. Pass
 * obfuscate={false} for plain text.
 *
 * The form posts to Formspree when a public form id is configured below;
 * until then it falls back to composing an email, so it always works.
 */
const FORMSPREE_ID = '' // public form id only — no secrets in the client

const EMAIL_PARTS = ['Forrest', '.', 'Eoin'] as const
const EMAIL_HOST = ['gmail', '.com'] as const
const PHONE_PARTS = ['07484', '835', '722'] as const

const email = () => `${EMAIL_PARTS.join('')}@${EMAIL_HOST.join('')}`
const phone = () => PHONE_PARTS.join(' ')

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

function RevealPhone({ obfuscate = true }: { obfuscate?: boolean }) {
  const [shown, setShown] = useState(!obfuscate)
  if (!shown) {
    return (
      <button
        type="button"
        onClick={() => setShown(true)}
        className="cursor-pointer border-0 bg-transparent p-0 font-mono text-mono-data text-[var(--text-md)]
                   underline decoration-[var(--line-2)] underline-offset-4 hover:decoration-[var(--accent)]"
      >
        Phone — click to reveal
      </button>
    )
  }
  return (
    <a href={`tel:+44${phone().replace(/\s/g, '').slice(1)}`} className="hover:text-[var(--accent)]">
      {phone()}
    </a>
  )
}

export default function ContactSection({ obfuscate = true }: { obfuscate?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    if (!FORMSPREE_ID) {
      const subject = encodeURIComponent(`Portfolio message from ${data.get('name') ?? ''}`)
      const body = encodeURIComponent(`${data.get('message') ?? ''}\n\n— ${data.get('name') ?? ''} <${data.get('email') ?? ''}>`)
      window.location.href = `mailto:${email()}?subject=${subject}&body=${body}`
      return
    }
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
            <RevealPhone obfuscate={obfuscate} />
            <br />
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
      </div>
    </section>
  )
}
