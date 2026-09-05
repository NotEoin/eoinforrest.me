import { Link, useParams } from 'react-router-dom'
import { m } from 'framer-motion'
import usePageTitle from '../lib/usePageTitle'
import MetaGrid from '../components/MetaGrid'
import MediaPlate from '../components/MediaPlate'
import Reveal from '../components/Reveal'
import { ArrowUpRight } from '../components/Icons'
import { bySlug, projects } from '../data/projects'
import { writeups } from '../data/writeups'
import NotFound from './NotFound'

export default function ProjectPage() {
  const { slug } = useParams()
  const project = slug ? bySlug(slug) : undefined
  usePageTitle(project?.published && project.hasPage ? project.name : '404')

  // unpublished projects, and rows that carry no page, 404 rather than render
  if (!project || !project.published || !project.hasPage) return <NotFound />

  const writeup = writeups[project.slug]
  const related = project.related
    .map(s => projects.find(p => p.slug === s))
    .filter(p => p && p.published && p.hasPage)

  return (
    <article className="px-[clamp(20px,4vw,72px)] pb-[clamp(64px,9vh,112px)] pt-[clamp(56px,8vh,88px)]">
      <div className="mx-auto max-w-[1200px]">
        {/* title block */}
        <header className="pb-8">
          <p className="m-0 font-mono text-mono-label uppercase text-[var(--text-lo)]">
            // {project.index} — {project.year}
          </p>
          <m.h1
            layoutId={`title-${project.slug}`}
            className="mt-4 text-display-l font-medium text-[var(--text-hi)]"
          >
            {project.name}
          </m.h1>
          <p className="m-0 mt-4 max-w-[52ch] text-body-l text-[var(--text-md)]">{project.hook}</p>
          <div aria-hidden="true" className="mt-8 h-px w-full" style={{ background: project.tint, opacity: 0.5 }} />
        </header>

        <MetaGrid project={project} />

        {/* plate */}
        {project.plate && project.plate.kind !== 'lens' && (
          <Reveal className="mt-10">
            <MediaPlate media={project.plate} tint={project.tint} />
          </Reveal>
        )}

        <div className="mt-6">
          {writeup?.before}
          {writeup?.after}

          {/* related */}
          {related.length > 0 && (
            <section className="border-t border-[var(--line)] py-[clamp(40px,6vh,72px)]">
              <h2 className="mb-7 font-mono text-mono-label uppercase text-[var(--text-lo)]">// Related</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map(p => (
                  <Link
                    key={p!.slug}
                    to={`/projects/${p!.slug}`}
                    className="group border border-[var(--line)] p-5 transition-colors duration-[180ms]
                               hover:border-[var(--line-2)]"
                  >
                    <p className="m-0 font-mono text-[11px] text-[var(--text-lo)] [font-variant-numeric:tabular-nums]">
                      {p!.index}
                    </p>
                    <p className="m-0 mt-1 text-body-m font-medium text-[var(--text-hi)]">{p!.name}</p>
                    <p className="m-0 mt-1.5 text-body-s text-[var(--text-md)]">{p!.hook}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* repo CTA */}
          {project.repo && (
            <section className="border-t border-[var(--line)] pt-[clamp(40px,6vh,64px)]">
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                Read the code and the full README on GitHub <ArrowUpRight className="text-[var(--accent)]" />
              </a>
            </section>
          )}
        </div>
      </div>
    </article>
  )
}
