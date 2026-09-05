import { projects } from '../data/projects'

/**
 * One source of truth for per-route <title> and description.
 *
 * Both consumers read this: `usePageTitle` sets the title on client navigation,
 * and `scripts/prerender.mjs` bakes the whole set into the static HTML at build
 * time. Adding a route here is enough to give it a correct title, description,
 * canonical URL and social card.
 */

export const SITE_URL = 'https://eoinforrest.me'

export const DEFAULT_DESCRIPTION =
  'Computer Science graduate (First-Class, Newcastle). Backend, systems and applied-AI projects, with playable demos.'

export interface RouteMeta {
  path: string
  title: string
  description: string
}

const staticRoutes: RouteMeta[] = [
  {
    path: '/',
    title: 'Eoin Forrest — Portfolio',
    description: DEFAULT_DESCRIPTION,
  },
  {
    path: '/projects',
    title: 'Eoin Forrest — Projects',
    description:
      'Eight projects in systems, applied AI, networking and tooling — each with a write-up explaining the reasoning, not just the setup.',
  },
  {
    path: '/cv',
    title: 'Eoin Forrest — CV',
    description:
      'First-class BSc Computer Science, Newcastle University. Backend, systems and applied-AI engineer seeking a graduate software role.',
  },
]

/** Only published pages get a route — the rest 404 by design. */
const projectRoutes: RouteMeta[] = projects
  .filter(p => p.published && p.hasPage)
  .map(p => ({
    path: `/projects/${p.slug}`,
    title: `Eoin Forrest — ${p.name}`,
    description: `${p.name} — ${p.hook}. ${p.stack.join(', ')}.`,
  }))

export const routes: RouteMeta[] = [...staticRoutes, ...projectRoutes]

export const metaFor = (path: string): RouteMeta | undefined =>
  routes.find(r => r.path === path)
