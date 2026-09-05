/**
 * Bakes every route in src/lib/routeMeta.ts into static HTML.
 *
 * Without this the site ships an empty <div id="root">: crawlers, LinkedIn's
 * preview bot and anything else that doesn't run JS see nothing at all, and
 * every route shares one title. Run after `vite build` and `vite build --ssr`.
 *
 *   dist/index.html                     ->  /
 *   dist/projects/index.html            ->  /projects
 *   dist/projects/<slug>/index.html     ->  /projects/<slug>
 *
 * The static host serves those directly and falls back to index.html for
 * anything else, so client-side routing is unaffected.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(root, 'dist')

const { render, routes } = await import(join(root, 'dist-ssr', 'entry-server.js'))
const template = await readFile(join(distDir, 'index.html'), 'utf8')

const escape = str =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Replace the content of a meta tag matched by attribute, or leave it alone. */
const setMeta = (html, attr, name, content) =>
  html.replace(
    new RegExp(`(<meta ${attr}="${name}" content=")[^"]*(")`),
    `$1${escape(content)}$2`,
  )

let written = 0

for (const route of routes) {
  const { path, title, description } = route
  const url = `https://eoinforrest.me${path}`

  let html = template
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${escape(url)}$2`,
  )
  html = setMeta(html, 'name', 'description', description)
  html = setMeta(html, 'property', 'og:title', title)
  html = setMeta(html, 'property', 'og:description', description)
  html = setMeta(html, 'property', 'og:url', url)
  html = setMeta(html, 'name', 'twitter:title', title)
  html = setMeta(html, 'name', 'twitter:description', description)

  const markup = render(path)
  html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`)

  const outPath =
    path === '/' ? join(distDir, 'index.html') : join(distDir, path, 'index.html')
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, html)
  written += 1
  console.log(`  prerendered ${path}`)
}

// Unknown paths: Vercel serves dist/404.html with a real 404 status when no
// route matches. Prerendering NotFound into it means the markup the client
// hydrates is the markup already on screen, and crawlers get an honest 404
// instead of a soft one.
{
  const title = 'Eoin Forrest — Not found'
  const description = 'That page doesn’t exist.'
  let html = template
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
  html = setMeta(html, 'name', 'description', description)
  html = setMeta(html, 'property', 'og:title', title)
  html = setMeta(html, 'property', 'og:description', description)
  html = html.replace('<link rel="canonical"', '<meta name="robots" content="noindex" />\n    <link rel="canonical"')
  html = html.replace('<div id="root"></div>', `<div id="root">${render('/404')}</div>`)
  await writeFile(join(distDir, '404.html'), html)
  console.log('  prerendered 404.html')
}

// The sitemap is generated from the same route list, so it can never drift out
// of step with what actually got built.
const lastmod = new Date().toISOString().slice(0, 10)
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  routes
    .map(
      ({ path }) =>
        '  <url>\n' +
        `    <loc>https://eoinforrest.me${path}</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `    <priority>${path === '/' ? '1.0' : path.startsWith('/projects/') ? '0.7' : '0.8'}</priority>\n` +
        '  </url>',
    )
    .join('\n') +
  '\n</urlset>\n'

await writeFile(join(distDir, 'sitemap.xml'), sitemap)
console.log(`  wrote sitemap.xml (${routes.length} urls)`)

console.log(`prerender: ${written} routes + 404`)
