/**
 * The single source of truth for every project on the site.
 * Every repo URL, tint, status, stack and media path comes from here —
 * no hand-typed URLs in components.
 */

export type Status = 'Works' | 'Prototype' | 'Partial' | 'Submitted'
export type Category = 'Systems' | 'AI / ML' | 'Networking' | 'Applications' | 'Tools'
export type DemoKey = 'lidar' | 'sniffer' | 'halvoice' | 'halrag' | 'hatch'

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
  published: boolean
  /** row 09 (Cramberry) has a row but no page */
  hasPage: boolean
  demo?: DemoKey
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
    demo: 'lidar',
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
    demo: 'hatch',
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
    year: '2025',
    status: 'Prototype',
    categories: ['Networking'],
    tint: 'var(--tint-sniffer)',
    repo: `${GITHUB}/mac-sniffer`,
    licence: 'MIT',
    role: 'Sole developer',
    published: true,
    hasPage: true,
    demo: 'sniffer',
    related: [],
    plate: {
      kind: 'image',
      src: '/media/sniffer/clustering.png',
      width: 1596,
      height: 630,
      label: 'CLUSTERING — raw vs clustered count, true headcount annotated',
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
    demo: 'halvoice',
    related: ['hal'],
    plate: {
      kind: 'lens',
      width: 900,
      height: 900,
      label: 'THE LENS — rendered live from the demo component',
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
    demo: 'halrag',
    related: ['hal-voice', 'canvas-downloader'],
    plate: {
      kind: 'video',
      src: '/media/hal/vault-graph.mp4',
      poster: '/media/hal/vault-graph-poster.jpg',
      width: 1920,
      height: 1040,
      label: 'VAULT GRAPH — the Obsidian vault graph growing during import',
    },
  },
  {
    slug: 'cxr-zeroshot-segmentation',
    index: '06',
    name: 'Zero-shot CXR segmentation',
    hook: 'Can a frozen vision-language model localise pathology from text alone?',
    stack: ['PyTorch', 'BiomedCLIP'],
    year: '2026',
    status: 'Submitted',
    categories: ['AI / ML'],
    tint: 'var(--tint-cxr)',
    repo: `${GITHUB}/cxr-zeroshot-segmentation`,
    licence: null,
    role: 'Sole developer (dissertation)',
    // gated until supervisor sign-off and a licence choice
    published: false,
    hasPage: true,
    related: ['jupyter-tts-alerts'],
    plate: {
      kind: 'image',
      src: '/media/cxr/overlays.png',
      width: 1600,
      height: 900,
      label: 'OVERLAYS — predicted mask over radiograph grid (DUA check first)',
    },
  },
  {
    slug: 'canvas-downloader',
    index: '07',
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
    index: '08',
    name: 'jupyter-tts-alerts',
    hook: 'Your notebook tells you out loud when a six-hour cell finishes',
    stack: ['Python'],
    year: '2026',
    status: 'Works',
    categories: ['Tools'],
    tint: 'var(--tint-util)',
    repo: `${GITHUB}/jupyter-tts-alerts`,
    licence: null,
    role: 'Sole developer',
    published: true,
    hasPage: true,
    related: ['cxr-zeroshot-segmentation'],
    plate: {
      kind: 'image',
      src: '/media/jupyter/behaviour.png',
      width: 1215,
      height: 480,
      label: 'BEHAVIOUR — announcement rules by cell runtime',
    },
  },
  {
    slug: 'cramberry',
    index: '09',
    name: 'Cramberry',
    hook: 'A collaborative revision platform built in a university team',
    stack: ['React', 'Flask', 'Azure'],
    year: '2025',
    status: 'Works',
    categories: ['Applications'],
    tint: 'var(--tint-util)',
    repo: null,
    licence: null,
    role: 'Team project',
    published: true,
    hasPage: false,
    related: [],
  },
]

/** the five home-page acts, in reel order */
export const actSlugs = ['lidar', 'hatch', 'probe-sniffer', 'hal-voice', 'hal'] as const

export const bySlug = (slug: string) => projects.find(p => p.slug === slug)

/** rows shown on /projects — the cxr row stays hidden until sign-off */
export const indexRows = projects.filter(p => p.published)
