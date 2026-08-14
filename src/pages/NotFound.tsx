import { Link } from 'react-router-dom'
import usePageTitle from '../lib/usePageTitle'

export default function NotFound() {
  usePageTitle('404')
  return (
    <section className="flex min-h-[calc(100dvh-46px)] flex-col justify-center px-[clamp(20px,4vw,72px)] py-24">
      <p className="m-0 font-mono text-mono-label uppercase text-[var(--text-lo)]">// 404</p>
      <h1 className="mt-5 max-w-[24ch] text-display-l font-medium text-[var(--text-hi)]">
        That page doesn't exist. It may never have.
      </h1>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/" className="btn btn-primary">Home</Link>
        <Link to="/projects" className="btn btn-secondary">All projects</Link>
        <Link to="/cv" className="btn btn-secondary">CV</Link>
      </div>
    </section>
  )
}
