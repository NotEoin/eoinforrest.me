import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'

/**
 * The prerender entry. Built separately (`npm run build:ssr`) and driven by
 * scripts/prerender.mjs, which renders every route in routeMeta to static HTML.
 *
 * Nothing here runs in the browser. Components must therefore not touch
 * `window` or `document` during render — all of them currently confine that to
 * effects, which never fire server-side.
 */
export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
}

export { routes } from './lib/routeMeta'
