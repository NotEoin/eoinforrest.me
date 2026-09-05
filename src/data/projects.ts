/**
 * The single source of truth for every project on the site.
 * Every repo URL, tint, status, stack and media path comes from here —
 * no hand-typed URLs in components.
 */

export type Status = 'Works' | 'Prototype' | 'Partial' | 'Submitted'
export type Category = 'Systems' | 'AI / ML' | 'Networking' | 'Applications' | 'Tools'

export interface PlateMedia {
  kind: 'video' | 'image' | 'lens'
  src?: string
  poster?: string
  webm?: string
  width: number
  height: number
  label: string
}

export interface Project {
  slug: string
  index: string
  name: string
  /** one-line hook, index register */
  hook: string
  stack: string[]
  year: string
  status: Status
  categories: Category[]
  tint: string
  repo: string | null
  licence: string | null
  role: string
  /** false hides the row and 404s the page — for work not yet cleared to show */
  published: boolean
  /** false gives a row on /projects but no page behind it */
  hasPage: boolean
  related: string[]
  plate?: PlateMedia
}

export const GITHUB = 'https://github.com/NotEoin'
export const LINKEDIN = 'https://www.linkedin.com/in/eoin-forrest/'
export const CV_PDF = '/Eoin-Forrest-CV.pdf'

export const projects: Project[] = [
  {
    slug: 'lidar',
    index: '01',
    name: 'Lidar Autonavigation',
    hook: 'A* pathfinding and obstacle avoidance inside a 4096-character budget',
    stack: ['Lua'],
    year: '2024–26',
    status: 'Works',
    categories: ['Systems'],
    tint: 'var(--tint-lidar)',
    repo: `${GITHUB}/Lidar-Autonavigation-System`,
    licence: 'GPL-3.0',
    role: 'Sole developer',
    published: true,
    hasPage: true,
    related: [],
    plate: {
      kind: 'video',
      src: '/media/lidar/lidar-hero.mp4',
      webm: '/media/lidar/lidar-hero.webm',
      poster: '/media/lidar/lidar-hero-poster.jpg',
      width: 1920,
      height: 1080,
      label: 'LIDAR HERO — boat crossing obstacle field, debug screen, A* replanning',
    },
  },
  {
    slug: 'hatch',
    index: '02',
    name: 'Hatch',
    hook: 'A mood tracker whose creature leaves the window and roams your desktop',
    stack: ['Electron', 'TS', 'SQLite'],
    year: '2026',
    status: 'Works',
    categories: ['Applications'],
    tint: 'var(--tint-hatch)',
    repo: `${GITHUB}/hatch`,
    licence: 'MIT',
    role: 'Sole developer',
    published: true,
    hasPage: true,
    related: [],
    // The check-in take: the creature leaves the window, asks you to check in
    // from the middle of the desktop, and walks back to open the panel. Loops
    // seamlessly. `hatch-checkin-ui` is the same take with the panel tour left
    // in, and `hatch-roam` is the earlier wander-only clip — swap either in here.
    plate: {
      kind: 'video',
      src: '/media/hatch/hatch-checkin.mp4',
      webm: '/media/hatch/hatch-checkin.webm',
      poster: '/media/hatch/hatch-checkin-poster.jpg',
      width: 1920,
      height: 1080,
      label: 'HATCH CHECK-IN — the creature leaves the window, prompts, and returns',
    },
  },
  {
    slug: 'probe-sniffer',
    index: '03',
    name: 'Probe Request Sniffer',
    hook: 'Counting devices through MAC randomisation by IE fingerprinting',
    stack: ['Python', 'scapy'],
    year: '2024–26',
    status: 'Prototype',
    categories: ['Networking'],
    tint: 'var(--tint-sniffer)',
    repo: `${GITHUB}/mac-sniffer`,
    licence: 'MIT',
    role: 'Sole developer',
    published: true,
    hasPage: true,
    related: [],
    plate: {
      kind: 'video',
      src: '/media/sniffer/live-capture.mp4',
      webm: '/media/sniffer/live-capture.webm',
      poster: '/media/sniffer/live-capture-poster.jpg',
      width: 1920,
      height: 1080,
      label: 'LIVE CAPTURE — 257 addresses over fifteen minutes, around 30 devices',
    },
  },
  {
    slug: 'hal-voice',
    index: '04',
    name: 'hal-voice',
    hook: 'Hiding TTS latency by speaking sentence one while the model writes two',
    stack: ['Python', 'GPT-SoVITS'],
    year: '2026',
    status: 'Works',
    categories: ['AI / ML'],
    tint: 'var(--tint-halvoice)',
    repo: `${GITHUB}/hal-voice`,
    licence: 'MIT',
    role: 'Sole developer',
    published: true,
    hasPage: true,
    related: ['hal'],
    plate: {
      kind: 'lens',
      width: 900,
      height: 900,
      label: 'THE LENS — drawn live on canvas, a port of the repo ui_eye.py',
    },
  },
  {
    slug: 'hal',
    index: '05',
    name: 'Hal',
    hook: 'A local RAG assistant whose long-term memory is an Obsidian vault',
    stack: ['Python', 'Ollama', 'MCP'],
    year: '2025–26',
    status: 'Works',
    categories: ['AI / ML'],
    tint: 'var(--tint-hal)',
    repo: `${GITHUB}/Hal`,
    licence: 'MIT',
    role: 'Sole developer',
    published: true,
    hasPage: true,
    related: ['hal-voice', 'canvas-downloader'],
    plate: {
      kind: 'video',
      src: '/media/hal/vault-graph.mp4',
      webm: '/media/hal/vault-graph.webm',
      poster: '/media/hal/vault-graph-poster.jpg',
      width: 1920,
      height: 1040,
      label: 'VAULT GRAPH — the Obsidian vault graph growing during import',
    },
  },
  {
    slug: 'canvas-downloader',
    index: '06',
    name: 'Canvas Downloader',
    hook: 'Archiving course files that only exist as links inside page HTML',
    stack: ['Python'],
    year: '2025',
    status: 'Works',
    categories: ['Tools'],
    tint: 'var(--tint-util)',
    repo: `${GITHUB}/canvas-downloader`,
    licence: 'MIT',
    role: 'Sole developer',
    published: true,
    hasPage: true,
    related: ['hal'],
    plate: {
      kind: 'image',
      src: '/media/canvas/linked-files.png',
      width: 1215,
      height: 492,
      label: 'LINKED FILES — files resolved out of page HTML',
    },
  },
  {
    slug: 'jupyter-tts-alerts',
    index: '07',
    name: 'jupyter-tts-alerts',
    hook: 'Your notebook tells you out loud when a six-hour cell finishes',
    stack: ['Python'],
    year: '2026',
    status: 'Works',
    categories: ['Tools'],
    tint: 'var(--tint-util)',
    repo: `${GITHUB}/jupyter-tts-alerts`,
    licence: 'MIT',
    role: 'Sole developer',
    published: true,
    hasPage: true,
    related: [],
    plate: {
      kind: 'image',
      src: '/media/jupyter/behaviour.png',
      width: 1215,
      height: 480,
      label: 'BEHAVIOUR — announcement rules by cell runtime',
    },
  },
]

/** the five home-page acts, in reel order */
export const actSlugs = ['lidar', 'hatch', 'probe-sniffer', 'hal-voice', 'hal'] as const

export const bySlug = (slug: string) => projects.find(p => p.slug === slug)

/** rows shown on /projects */
export const indexRows = projects.filter(p => p.published)
