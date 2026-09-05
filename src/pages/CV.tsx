import { Link } from 'react-router-dom'
import usePageTitle from '../lib/usePageTitle'
import { ArrowDown, ArrowUpRight } from '../components/Icons'
import { CV_PDF, GITHUB, LINKEDIN } from '../data/projects'
import { EmailLink, EmailText } from '../components/Email'
import cv from '../data/cv.json'

/**
 * The virtual CV. Every word below comes from `src/data/cv.json`, which
 * `tools/build-cv-pdf.py` also reads to write /Eoin-Forrest-CV.pdf, so the
 * page and the PDF cannot drift, whatever anyone forgets to update.
 *
 * Two deliberate differences from the PDF:
 *   - the email renders only after hydration, so it stays out of the
 *     prerendered HTML (see components/Email);
 *   - the phone number is in the PDF only. On the page it is just a line
 *     waiting to be harvested, and anyone who wants it has downloaded the CV.
 *
 * The content is ASCII by rule: no em dashes, no smart quotes, no arrows. The
 * PDF build asserts it and fails rather than shipping a stray glyph.
 */

const NAV: [string, string][] = [
  ['education', 'Education'],
  ['skills', 'Technical skills'],
  ['projects', 'Projects'],
  ['experience', 'Work experience'],
  ['additional', 'Additional'],
]

/** The one piece of markup cv.json carries: **bold** for a paragraph lead-in. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*.+?\*\*)/s).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-medium text-[var(--text-hi)]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}

function MarkBars({ rows }: { rows: [string, number][] }) {
  return (
    <ul className="m-0 list-none space-y-2.5 p-0 font-mono text-mono-data">
      {rows.map(([name, mark]) => (
        <li key={name}>
          <span className="flex items-baseline justify-between gap-4">
            <span className="text-[var(--text-md)]">{name}</span>
            <span className="text-[var(--text-hi)] [font-variant-numeric:tabular-nums]">{mark}</span>
          </span>
          {/* the one honest visual encoding on the site: the numbers are real,
              external and verifiable */}
          <span aria-hidden="true" className="mt-1.5 block h-px w-full bg-[var(--line)]">
            <span className="block h-px bg-[var(--accent)]" style={{ width: `${mark}%` }} />
          </span>
        </li>
      ))}
    </ul>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="cv-section border-t border-[var(--line)] py-[clamp(28px,4vh,44px)]">
      <h2 className="mb-6 font-mono text-mono-label uppercase text-[var(--text-lo)]">// {title}</h2>
      {children}
    </section>
  )
}

/** A titled entry: name, the grey meta line under it, then the prose. */
function Entry({
  title,
  meta,
  body,
  size = 'text-body-l',
  children,
}: {
  title: string
  meta: string
  body: string
  size?: string
  children?: React.ReactNode
}) {
  return (
    <article className="max-w-[68ch]">
      <h3 className={`${size} font-medium text-[var(--text-hi)]`}>{title}</h3>
      <p className="mt-1 font-mono text-mono-data text-[var(--text-lo)]">{meta}</p>
      <p className="mt-3 text-body-m text-[var(--text-md)]">
        <Rich text={body} />
      </p>
      {children}
    </article>
  )
}

export default function CV() {
  usePageTitle('CV')

  return (
    <div className="cv-grid mx-auto grid max-w-[1200px] gap-[clamp(28px,4vw,64px)] px-[clamp(20px,4vw,72px)] pb-[clamp(64px,9vh,112px)] pt-[clamp(64px,9vh,96px)] md:grid-cols-[minmax(220px,300px)_1fr]">
      {/* rail */}
      <aside className="no-print md:sticky md:top-[70px] md:self-start">
        <h1 className="text-title-m font-medium text-[var(--text-hi)]">Eoin Forrest</h1>
        <p className="mt-2 max-w-[32ch] text-body-s text-[var(--text-md)]">{cv.title}</p>
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[12px] leading-relaxed">
          <dt className="text-[var(--text-lo)]">Email</dt>
          <dd className="m-0 text-[var(--text-md)]">
            <EmailLink className="hover:text-[var(--accent)]" />
          </dd>
          <dt className="text-[var(--text-lo)]">LinkedIn</dt>
          <dd className="m-0 text-[var(--text-md)]">
            <a href={LINKEDIN} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">/in/eoin-forrest</a>
          </dd>
          <dt className="text-[var(--text-lo)]">GitHub</dt>
          <dd className="m-0 text-[var(--text-md)]">
            <a href={GITHUB} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">@NotEoin</a>
          </dd>
        </dl>
        <p className="mt-4 max-w-[30ch] font-mono text-[11px] leading-[1.8] text-[var(--text-lo)]">
          London / Newcastle | open to relocation | UK &amp; Irish citizen (no visa sponsorship required)
        </p>
        <a href={CV_PDF} download className="btn btn-primary mt-7">
          Download PDF <ArrowDown className="text-[var(--accent)]" />
        </a>
        <nav aria-label="CV sections" className="mt-8 hidden md:block">
          <ul className="m-0 list-none space-y-1.5 p-0 font-mono text-[11px] uppercase tracking-[.12em]">
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-[var(--text-lo)] hover:text-[var(--text-hi)]">{label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* the document */}
      <div className="cv-doc min-w-0">
        {/* print carries its own header, since the rail is screen-only */}
        <header className="cv-print-header hidden print:block">
          <h2 className="text-[20px] font-medium text-[var(--text-hi)]">Eoin Forrest</h2>
          <p className="mt-1 font-mono text-[10px] text-[var(--text-lo)]">
            <EmailText /> | linkedin.com/in/eoin-forrest | github.com/NotEoin | eoinforrest.me
            <br />
            London / Newcastle | open to relocation | UK &amp; Irish citizen (no visa sponsorship required)
          </p>
        </header>

        <section className="cv-section pb-[clamp(28px,4vh,44px)]">
          <p className="max-w-[68ch] text-body-l text-[var(--text-hi)]">{cv.summary}</p>
        </section>

        <Section id="education" title="Education">
          <div className="space-y-7">
            {cv.education.map(entry => (
              <Entry
                key={entry.qualification}
                title={entry.qualification}
                meta={entry.meta}
                body={entry.detail}
              />
            ))}
          </div>
          <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {cv.modules.map(group => (
              <div key={group.year}>
                <h4 className="mb-3 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">
                  {group.year}
                </h4>
                <MarkBars rows={group.rows as [string, number][]} />
              </div>
            ))}
          </div>
        </Section>

        <Section id="skills" title="Technical skills">
          <dl className="m-0 space-y-5">
            {(cv.skills as [string, string[]][]).map(([group, items]) => (
              <div key={group}>
                <dt className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">{group}</dt>
                <dd className="m-0 flex flex-wrap gap-1.5">
                  {items.map(item => (
                    <span
                      key={item}
                      className="border border-[var(--line)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-md)]"
                    >
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="projects" title="Projects">
          <div className="space-y-8">
            {cv.projects.map(p => (
              <Entry key={p.slug} title={p.name} meta={p.stack} body={p.body}>
                <p className="no-print mt-2 font-mono text-[11px] uppercase tracking-[.12em]">
                  <Link
                    to={`/projects/${p.slug}`}
                    className="inline-flex items-center gap-1.5 text-[var(--text-hi)] hover:text-[var(--accent)]"
                  >
                    Read the write-up <ArrowUpRight />
                  </Link>
                </p>
              </Entry>
            ))}

            <p className="max-w-[68ch] text-body-s text-[var(--text-lo)]">
              {cv.moreProjects}
            </p>
          </div>
        </Section>

        <Section id="experience" title="Work experience">
          <div className="space-y-7">
            {cv.experience.map(job => (
              <Entry
                key={job.org}
                title={`${job.role}, ${job.org}`}
                meta={job.dates}
                body={job.body}
                size="text-body-m"
              />
            ))}
          </div>
        </Section>

        <Section id="additional" title="Additional">
          <ul className="m-0 max-w-[68ch] list-none space-y-2 p-0 text-body-m text-[var(--text-md)]">
            {(cv.additional as [string, string][]).map(([label, body]) => (
              <li key={label}>
                <Rich text={`**${label}:** ${body}`} />
              </li>
            ))}
          </ul>
          <p className="mt-8 text-body-s text-[var(--text-lo)]">{cv.closing}</p>
        </Section>
      </div>
    </div>
  )
}
