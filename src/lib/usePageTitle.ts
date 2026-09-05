import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { DEFAULT_DESCRIPTION, SITE_URL, metaFor } from './routeMeta'

/** Set (or create) a <meta> tag by name or property. */
function setMeta(key: 'name' | 'property', value: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(key, value)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Keeps the title, description, canonical and social tags in step with the
 * current route on client-side navigation.
 *
 * The prerender writes the same values into each route's static HTML, so a
 * crawler that never runs JS sees exactly what a browser ends up with. `page`
 * overrides the title for routes with no entry in routeMeta — 404, mainly.
 */
export default function usePageTitle(page?: string) {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = metaFor(pathname)
    const title = page ? `Eoin Forrest — ${page}` : meta?.title ?? 'Eoin Forrest — Portfolio'
    const description = meta?.description ?? DEFAULT_DESCRIPTION
    const url = `${SITE_URL}${pathname}`

    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }, [page, pathname])
}
