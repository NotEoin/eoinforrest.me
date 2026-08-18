import usePageTitle from '../lib/usePageTitle'
import IntroSection from '../components/IntroSection'
import ActSection, { ActCopy } from '../components/ActSection'
import LensPlate from '../components/LensPlate'
import CVStripSection from '../components/CVStripSection'
import ContactSection from '../components/ContactSection'
import { bySlug } from '../data/projects'

/**
 * The reel: strongest and most visual first, most technically credible last.
 *
 * Each act reads as four tiers. `title` is the project's own name and nothing
 * else. `tagline` is the hero line from the top of that project's repository
 * README, verbatim, and `hook` is the paragraph directly beneath it — so the
 * site and the repos say the same thing in the same words.
 */
const ACTS: { slug: string; copy: ActCopy }[] = [
  {
    slug: 'lidar',
    copy: {
      eyebrow: '// 01 — Real-time control · Lua · 2024–2026',
      title: 'Lidar Autonavigation',
      tagline: 'Give your boat a destination. It works out the rest.',
      hook: 'An autonomous, obstacle-aware autopilot for boats in Stormworks: Build and Rescue. It sweeps a set of laser rangefinders, builds a live map of what’s around it, plots a route with A*, and steers there — replanning as it discovers new obstacles.',
      stackRow: 'Lua · A* · pure pursuit · 3D rotation matrices',
      align: 'left',
    },
  },
  {
    slug: 'hatch',
    copy: {
      eyebrow: '// 02 — Desktop application · Electron + TypeScript · 2026',
      title: 'Hatch',
      tagline: 'Mood tracking that doesn’t feel like homework.',
      hook: 'A mood tracker with a pixel creature — a Moodling — that lives on your desktop rather than inside a window. It walks out of the app, wanders across your screen, and comes and finds you when it’s time to check in.',
      stackRow: 'Electron · React · TypeScript · SQLite · ~10k lines',
      align: 'right',
    },
  },
  {
    slug: 'probe-sniffer',
    copy: {
      eyebrow: '// 03 — Network sensing · Python · 802.11 · 2025',
      title: 'Probe Request Sniffer',
      tagline: 'How many people are in this room? Ask their phones.',
      hook: 'Estimate how many devices are nearby by passively listening for the WiFi probe requests phones broadcast — and get a useful number back even though modern phones randomise their MAC address specifically to prevent this.',
      stackRow: 'Python · scapy · IE fingerprinting · sliding-window tracker',
      align: 'left',
    },
  },
  {
    slug: 'hal-voice',
    copy: {
      eyebrow: '// 04 — Voice interface · Python · local models · 2026',
      title: 'hal-voice',
      tagline: '“I am completely operational, and all my circuits are functioning perfectly.”',
      hook: 'Talk to Claude Code and have it answer out loud, in the voice of HAL 9000, with a red lens watching you from the corner of the screen. Speech recognition and synthesis always run on your own machine; the thinking is done by whatever Claude Code you already have.',
      stackRow: 'faster-whisper · GPT-SoVITS · pedalboard · MCP',
      align: 'right',
    },
  },
  {
    slug: 'hal',
    copy: {
      eyebrow: '// 05 — Local RAG assistant · Python · Ollama · MCP · 2025–2026',
      title: 'Hal',
      tagline: 'An AI assistant that remembers what you told it last week — and never sends any of it anywhere.',
      hook: 'Hal runs a capable coding and research assistant entirely on your own GPU, and gives it long-term memory by wiring it into an Obsidian vault. Ask it questions about your own notes and it answers with citations you can click.',
      stackRow: 'Python · Ollama · NumPy vector store · MCP server',
      align: 'full',
    },
  },
]

export default function Home() {
  usePageTitle()

  return (
    <>
      <IntroSection />
      {ACTS.map(({ slug, copy }, i) => {
        const project = bySlug(slug)!
        return (
          <ActSection
            key={slug}
            project={project}
            copy={copy}
            actNumber={String(i + 1).padStart(2, '0')}
            plateOverride={slug === 'hal-voice' ? <LensPlate /> : undefined}
          />
        )
      })}
      <CVStripSection />
      <ContactSection />
    </>
  )
}
