import usePageTitle from '../lib/usePageTitle'
import IntroSection from '../components/IntroSection'
import ActSection, { ActCopy } from '../components/ActSection'
import LensPlate from '../components/LensPlate'
import EcosystemSection from '../components/EcosystemSection'
import CVStripSection from '../components/CVStripSection'
import ContactSection from '../components/ContactSection'
import { bySlug } from '../data/projects'

/** the reel: strongest and most visual first, most technically credible last */
const ACTS: { slug: string; copy: ActCopy }[] = [
  {
    slug: 'lidar',
    copy: {
      eyebrow: '// 01 — Real-time control · Lua · 2024–2026',
      title: 'Laser-guided autonavigation',
      hook: 'A* pathfinding and obstacle avoidance for boats, written to fit inside a 4096-character script budget on an engine that gives you one tick to think.',
      stackRow: 'Lua · A* · pure pursuit · 3D rotation matrices',
      align: 'left',
    },
  },
  {
    slug: 'hatch',
    copy: {
      eyebrow: '// 02 — Desktop application · Electron + TypeScript · 2026',
      title: 'A creature that leaves the window',
      hook: "A mood tracker whose pixel creature isn't confined to the app — it walks out of the window, roams your desktop, and comes to find you when it's time to check in.",
      stackRow: 'Electron · React · TypeScript · SQLite · ~10k lines',
      align: 'right',
    },
  },
  {
    slug: 'probe-sniffer',
    copy: {
      eyebrow: '// 03 — Network sensing · Python · 802.11 · 2025',
      title: 'Counting people through MAC randomisation',
      hook: "Every modern phone randomises its MAC address specifically to stop you counting it. Fingerprinting each frame's information elements puts one physical device back to one identity.",
      stackRow: 'Python · scapy · IE fingerprinting · sliding-window tracker',
      align: 'left',
    },
  },
  {
    slug: 'hal-voice',
    copy: {
      eyebrow: '// 04 — Voice interface · Python · local models · 2026',
      title: "The hard part isn't the voice",
      hook: 'A HAL 9000 voice interface for Claude Code. Making a local model with slow token throughput feel like something that answers you means speaking sentence one while the model is still writing sentence two.',
      stackRow: 'faster-whisper · GPT-SoVITS · pedalboard · MCP',
      align: 'right',
    },
  },
  {
    slug: 'hal',
    copy: {
      eyebrow: '// 05 — Local RAG assistant · Python · Ollama · MCP · 2025–2026',
      title: '32K context, spent carefully',
      hook: 'A coding and research assistant that runs entirely on one consumer GPU and takes its long-term memory from an Obsidian vault. Every design decision answers one question: what is the least context that makes this answer good?',
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
      <EcosystemSection />
      <CVStripSection />
      <ContactSection />
    </>
  )
}
