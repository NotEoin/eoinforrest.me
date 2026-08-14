import { GITHUB, LINKEDIN } from '../data/projects'

export default function Footer() {
  return (
    <footer
      className="grid gap-6 border-t border-[var(--line)] px-[clamp(20px,4vw,72px)] py-[clamp(40px,6vh,72px)]
                 font-mono text-[11px] leading-[1.9] text-[var(--text-lo)]
                 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22ch),1fr))]"
    >
      <p className="m-0">Eoin Forrest — 2026</p>
      <p className="m-0">
        <a href="/#contact" className="text-[var(--text-md)] hover:text-[var(--accent)]">Email</a>
        {' · '}
        <a href={LINKEDIN} target="_blank" rel="noreferrer" className="text-[var(--text-md)] hover:text-[var(--accent)]">LinkedIn</a>
        {' · '}
        <a href={GITHUB} target="_blank" rel="noreferrer" className="text-[var(--text-md)] hover:text-[var(--accent)]">GitHub</a>
      </p>
      <p className="m-0 max-w-[40ch]">
        Built with Vite, React and too much attention to easing curves.{' '}
        <a href={`${GITHUB}/eoinforrest.me`} target="_blank" rel="noreferrer" className="text-[var(--text-md)] hover:text-[var(--accent)]">
          Source on GitHub.
        </a>
      </p>
    </footer>
  )
}
