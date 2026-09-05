import { useEffect, useState } from 'react'

/**
 * The address is assembled from parts at call time, never written as a literal.
 *
 * This matters more since the site started prerendering: anything present
 * during the server render ends up as plain text in the served HTML, which is
 * exactly where address harvesters look. Components gate on `useMounted` so the
 * address stays out of every static file, at a cost to a real reader of one
 * frame.
 */

const PARTS = ['Forrest', '.', 'Eoin'] as const
const HOST = ['gmail', '.com'] as const

export const emailAddress = () => `${PARTS.join('')}@${HOST.join('')}`

/** False during the server render and the first client render, so hydration
 *  matches; true immediately after. */
export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
