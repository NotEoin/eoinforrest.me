import { Link } from 'react-router-dom'
import usePageTitle from '../lib/usePageTitle'
import { ArrowDown } from '../components/Icons'
import { CV_PDF, GITHUB, LINKEDIN } from '../data/projects'
import { EmailLink, EmailText } from '../components/Email'

/**
 * The virtual CV. Content is the canonical `Eoin Forrest CV 2026` — the page
 * and /Eoin-Forrest-CV.pdf are updated in the same commit, always.
 *
 * The phone number is in the PDF only. On the page it is just a line waiting to
 * be harvested, and anyone who wants it has already downloaded the CV.
 */

const FINAL_YEAR: [string, number][] = [
  ['Distributed Systems', 76],
  ['Cryptography', 80],
  ['System & Network Security', 79],
  ['Computer Vision & AI', 68],
  ['Major Project & Dissertation', 66],
]

const EARLIER: [string, number][] = [
  ['Algorithm Design & Analysis', 86],
  ['Security Programming', 77],
  ['Software Systems Design & Implementation', 79],
  ['Software Engineering Team Project', 73],
  ['Computer Systems Design & Architectures', 96],
]

const SKILLS: [string, string[]][] = [
  ['Languages', ['Bash', 'C', 'C++', 'C#', 'Go', 'Java', 'JavaScript/TypeScript', 'Lua', 'Python', 'SQL']],
  ['Backend & systems', ['Concurrency/multithreading', 'Distributed systems', 'Electron', 'FastAPI', 'Flask', 'MySQL/MariaDB', 'REST APIs', 'SQLite']],
  ['AI / ML', ['Computer vision', 'Deep-learning interpretability', 'Local LLM inference (Ollama)', 'Model Context Protocol (MCP)', 'Retrieval-augmented generation (RAG)', 'Vector search']],
  ['Web', ['CSS', 'HTML', 'Next.js', 'React', 'Tailwind']],
  ['Tools & practices', ['Git', 'Linux', 'Networking (Wireshark, Cisco Packet Tracer)', 'Security fundamentals', 'Technical documentation', 'Testing']],
]

const CV_PROJECTS: { name: string; stack: string; body: string; slug: string }[] = [
  {
    name: 'Hal — local RAG AI assistant',
    stack: 'Python, Ollama, MCP, NumPy',
    slug: 'hal',
    body: 'A privacy-preserving retrieval-augmented assistant that answers strictly from a personal knowledge base and runs entirely offline. Built from first principles: heading-aware chunking, a NumPy vector store with cosine similarity, and incremental re-indexing keyed on content hashes. Exposes its search as an MCP server with path-traversal guards. Spawned two specialised tools: hambot, an AI archivist that catalogued a real 594-source corpus into ~18,000 cross-links with zero broken links using a VRAM-aware 7B-vision / 30B-text pipeline on a single GPU; and hal-voice, a hands-free voice interface (wake word → Whisper STT → synthesised speech).',
  },
  {
    name: 'Probe Request Sniffer — passive Wi-Fi device counting',
    stack: 'Python, scapy/pyshark, 802.11',
    slug: 'probe-sniffer',
    body: "A passive 802.11 sniffer that sees through MAC randomisation by fingerprinting each frame's information elements, so one physical device maps to one identity. Pluggable capture backends behind a clean abstraction, a thread-safe sliding-window tracker with lazy expiry, and an ergonomic CLI.",
  },
  {
    name: 'LIDAR Autonomous Navigation',
    stack: 'Lua, A*, control theory, linear algebra',
    slug: 'lidar',
    body: 'A real-time autopilot that sweeps a laser to build a live obstacle map, plans with a tick-sliced A* search, and follows the route with pure-pursuit steering and Catmull-Rom smoothing — all inside a hard 4096-character microcontroller limit that forced genuine optimisation. Uses 3D rotation matrices for attitude compensation and an O(1) hash-set spatial map.',
  },
  {
    name: 'Hatch — AI desktop companion',
    stack: 'Electron, React, TypeScript, SQLite, FastAPI',
    slug: 'hatch',
    body: 'An ~10k-line Electron desktop pet with a deterministic simulation engine, a ~30 Hz desktop-presence system using transparent overlay windows, event-sourced SQLite persistence with versioned migrations, and an optional supervised Python AI sidecar behind a typed IPC boundary.',
  },
]

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

export default function CV() {
  usePageTitle('CV')

  return (
    <div className="cv-grid mx-auto grid max-w-[1200px] gap-[clamp(28px,4vw,64px)] px-[clamp(20px,4vw,72px)] pb-[clamp(64px,9vh,112px)] pt-[clamp(64px,9vh,96px)] md:grid-cols-[minmax(220px,300px)_1fr]">
      {/* rail */}
      <aside className="no-print md:sticky md:top-[70px] md:self-start">
        <h1 className="text-title-m font-medium text-[var(--text-hi)]">Eoin Forrest</h1>
        <p className="mt-2 max-w-[32ch] text-body-s text-[var(--text-md)]">
          Computer Science graduate — backend, systems and applied AI
        </p>
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
          London / Newcastle · open to relocation · UK &amp; Irish citizen (no visa sponsorship required)
        </p>
        <a href={CV_PDF} download className="btn btn-primary mt-7">
          Download PDF <ArrowDown className="text-[var(--accent)]" />
        </a>
        <nav aria-label="CV sections" className="mt-8 hidden md:block">
          <ul className="m-0 list-none space-y-1.5 p-0 font-mono text-[11px] uppercase tracking-[.12em]">
            {[
              ['education', 'Education'],
              ['skills', 'Technical skills'],
              ['projects', 'Projects'],
              ['experience', 'Work experience'],
              ['additional', 'Additional'],
            ].map(([id, label]) => (
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
            <EmailText /> · linkedin.com/in/eoin-forrest · github.com/NotEoin · eoinforrest.me
            <br />
            London / Newcastle · open to relocation · UK &amp; Irish citizen (no visa sponsorship required)
          </p>
        </header>
        <section className="cv-section pb-[clamp(28px,4vh,44px)]">
          <p className="max-w-[68ch] text-body-l text-[var(--text-hi)]">
            First-class Computer Science graduate from Newcastle University seeking a graduate software
            engineering role. Comfortable across the stack but happiest building backend, systems, and
            applied-AI software — from local retrieval-augmented AI assistants and real-time control systems
            to passive network-sensing tools. I care about clean, well-documented code and about things
            working end-to-end.
          </p>
        </section>

        <Section id="education" title="Education">
          <h3 className="text-body-l font-medium text-[var(--text-hi)]">
            BSc (Hons) Computer Science — First-Class Honours
          </h3>
          <p className="mt-1 font-mono text-mono-data text-[var(--text-lo)]">
            Newcastle University · Sep 2023 – Jun 2026 · accredited by BCS, The Chartered Institute for IT
          </p>
          <p className="mt-5 max-w-[68ch] text-body-m text-[var(--text-md)]">
            <strong className="font-medium text-[var(--text-hi)]">
              Dissertation — <em className="not-italic">From Latent Concept Vectors to Anatomy-Conditioned Dense Readouts</em>:
            </strong>{' '}
            an applied machine-learning research project in deep-learning interpretability and computer
            vision, extracting human-interpretable concepts from a neural network and using them to
            condition dense, anatomy-aware predictions.
          </p>
          <div className="mt-7 grid gap-8 sm:grid-cols-2">
            <div>
              <h4 className="mb-3 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">
                Final-year modules
              </h4>
              <MarkBars rows={FINAL_YEAR} />
            </div>
            <div>
              <h4 className="mb-3 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">
                Selected earlier modules
              </h4>
              <MarkBars rows={EARLIER} />
            </div>
          </div>
          <h3 className="mt-9 text-body-m font-medium text-[var(--text-hi)]">
            Access to Higher Education Diploma: Computing
          </h3>
          <p className="mt-1 font-mono text-mono-data text-[var(--text-lo)]">
            Kingston College · Sep 2022 – Jul 2023 · 30 units at Distinction, 15 at Merit
          </p>
        </Section>

        <Section id="skills" title="Technical skills">
          <dl className="m-0 space-y-5">
            {SKILLS.map(([group, items]) => (
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
            {CV_PROJECTS.map(p => (
              <article key={p.slug} className="max-w-[68ch]">
                <h3 className="text-body-l font-medium text-[var(--text-hi)]">{p.name}</h3>
                <p className="mt-1 font-mono text-mono-data text-[var(--text-lo)]">{p.stack}</p>
                <p className="mt-3 text-body-m text-[var(--text-md)]">{p.body}</p>
                <p className="no-print mt-2 font-mono text-[11px] uppercase tracking-[.12em]">
                  <Link to={`/projects/${p.slug}`} className="text-[var(--text-hi)] hover:text-[var(--accent)]">
                    Read the write-up →
                  </Link>
                </p>
              </article>
            ))}
            <p className="max-w-[68ch] text-body-s italic text-[var(--text-lo)]">
              More projects — including an autonomous recovery drone and a Canvas API archiver — at{' '}
              <Link to="/projects" className="not-italic text-[var(--text-md)] hover:text-[var(--accent)]">eoinforrest.me/projects</Link>{' '}
              and <a href={GITHUB} target="_blank" rel="noreferrer" className="not-italic text-[var(--text-md)] hover:text-[var(--accent)]">github.com/NotEoin</a>.
            </p>
          </div>
        </Section>

        <Section id="experience" title="Work experience">
          <div className="space-y-7">
            <article className="max-w-[68ch]">
              <h3 className="text-body-m font-medium text-[var(--text-hi)]">Bartender · The Old George Inn</h3>
              <p className="mt-1 font-mono text-mono-data text-[var(--text-lo)]">Nov 2024 – May 2025</p>
              <p className="mt-2 text-body-m text-[var(--text-md)]">
                Delivered fast, high-quality service to 400+ customers per shift during peak periods,
                coordinating with a team of five.
              </p>
            </article>
            <article className="max-w-[68ch]">
              <h3 className="text-body-m font-medium text-[var(--text-hi)]">Bartender / Supervisor · Bar Malden</h3>
              <p className="mt-1 font-mono text-mono-data text-[var(--text-lo)]">May 2024 – Sep 2024</p>
              <p className="mt-2 text-body-m text-[var(--text-md)]">
                Trained new staff, delegated tasks, and upheld safety and licensing standards. Handled
                cashing-up, weekly banking, inventory, audits, and cellar operations including stock,
                shipments, and contractor coordination.
              </p>
            </article>
          </div>
        </Section>

        <Section id="additional" title="Additional">
          <ul className="m-0 max-w-[68ch] list-none space-y-2 p-0 text-body-m text-[var(--text-md)]">
            <li>
              <strong className="font-medium text-[var(--text-hi)]">Community:</strong> Volunteered with Cancer
              Research UK and at a community coffee bar.
            </li>
            <li>
              <strong className="font-medium text-[var(--text-hi)]">Interests:</strong> Active in university
              societies — computing &amp; technology, skateboarding, running, fellwalking, and cold-water
              swimming.
            </li>
          </ul>
          <p className="mt-8 text-body-s italic text-[var(--text-lo)]">References available on request.</p>
        </Section>
      </div>
    </div>
  )
}
