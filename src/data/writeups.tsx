import { ReactNode } from 'react'
import ProseBlock, { Decision } from '../components/ProseBlock'
import Figure from '../components/Figure'

/**
 * The long-form prose for every project page. This is the owner's own
 * writing, from the design dossier — verbatim, not rewritten.
 *
 * `before` renders above the demo (why it exists, the hard part);
 * `after` renders below it (decisions, rough edges, anything else).
 */
export interface Writeup {
  before: ReactNode
  after: ReactNode
}

export const writeups: Record<string, Writeup> = {
  /* ------------------------------------------------------------- lidar */
  lidar: {
    before: (
      <>
        <ProseBlock title="Why it exists">
          <p>
            <em>Stormworks</em> is a physics sandbox where you program vehicle microcontrollers in Lua. I
            wanted a boat that could be given a destination and get there on its own, reading the world
            through laser rangefinders. The game gives you no navigation primitives — no pathfinding, no
            occupancy map, nothing beyond a GPS readout and a compass. Everything else is built from those.
          </p>
        </ProseBlock>
        <ProseBlock title="The hard part">
          <p>
            Scripts were capped at 4096 characters — characters, including whitespace — on an engine that
            runs logic at 60Hz and simply drops a script that overruns its tick. Almost every design
            decision traces back to those two limits. The A* search is incremental because a complete
            search fits in neither one tick nor the character budget. The obstacle table is keyed on the
            string <code className="font-mono text-mono-data text-[var(--text-hi)]">"x,y"</code> because{' '}
            <code className="font-mono text-mono-data text-[var(--text-hi)]">obstacles[x..","..y]</code> is
            dramatically shorter than the nested-table equivalent and faster to probe. The system runs on
            two microcontrollers because it stopped fitting in one.
          </p>
          <p>
            Then I ran out of room. The project sat unfinished for months — not because the remaining
            features were hard, but because there was physically no space left to express them. A game
            update raised the cap to 8192 and it restarted the same week. Side lasers, spline following and
            the ghost track all came after that. I don't think I'd have written it the same way with 8192
            from the start, and it would probably have been worse.
          </p>
          <Figure
            src="/media/lidar/debug-annotated.png"
            ratio="16/10"
            alt="The in-game debug screen, annotated: corridor, ghost track, obstacle cells, laser beams and the vehicle marker"
            caption="The debug screen — corridor, ghost track, obstacle cells, beams, vehicle"
            tint="var(--tint-lidar)"
            size="1600×1000"
          />
        </ProseBlock>
      </>
    ),
    after: (
      <>
        <ProseBlock title="Decisions" wide>
          <div className="space-y-6">
            <Decision title="Octile heuristic, not Euclidean.">
              <p>
                Movement is 8-connected, so octile distance is the exact cost of an unobstructed path while
                Euclidean underestimates it. An admissible-but-loose heuristic still finds the optimal path
                — it just expands far more nodes getting there, which on a tick budget means visibly slower
                replanning.
              </p>
            </Decision>
            <Decision title="Diagonal corner-cutting rejected.">
              <p>
                A diagonal hop is "pinched" if either flanking orthogonal cell is occupied; pinched hops
                are dropped. Without this the boat plots a course through the gap between two rocks and
                drives into both.
              </p>
            </Decision>
            <Decision title="Clearance penalty in the cost function.">
              <p>
                A geometrically optimal path that clips scenery on every corner is not optimal for a boat
                with momentum.
              </p>
            </Decision>
            <Decision title="Pure pursuit instead of string-pulling.">
              <p>
                Early versions steered at the next visible node, which makes the helm saw back and forth:
                by the time the boat responds it has passed the point it was aiming at. The current version
                projects the boat onto the corridor polyline and aims at a carrot further along it, with
                look-ahead scaling with speed.
              </p>
            </Decision>
            <Decision title="Gimbals solved in the body frame.">
              <p>
                The stabiliser reads attitude and drives six laser pivots from the same tick's attitude.
                One tick of lag smears the beams during fast roll and drops phantom obstacles into the map.
                Solving in the body frame also means the lasers stay level through a complete capsize.
              </p>
            </Decision>
          </div>
        </ProseBlock>
        <ProseBlock title="Rough edges">
          <p>
            <code className="font-mono text-mono-data text-[var(--text-hi)]">isObstructed()</code> is
            called more often than it needs to be — that's the next optimisation. Detection is 2D, so
            height-based obstacles are invisible to it; fine for a boat, wrong for anything else. Smoothing
            is corner-merging plus pure pursuit rather than a proper spline.
          </p>
        </ProseBlock>
      </>
    ),
  },

  /* ------------------------------------------------------------- hatch */
  hatch: {
    before: (
      <>
        <ProseBlock title="Why it exists">
          <p>
            I wanted to track my own mood and knew I wouldn't stick with a form. The mechanic came from a
            websocket demo that syncs a sprite across browser windows so it can walk between them; I pulled
            it apart to understand it, then wondered what it would be as a real desktop application rather
            than a browser toy — a creature that treats your whole screen as its world. Once the creature
            can leave the window, the check-in stops being a notification you dismiss and becomes something
            that walks over to you. That reframing is the entire product idea.
          </p>
        </ProseBlock>
        <ProseBlock title="The hard part">
          <p>
            Electron gives you windows. It does not give you a sprite that can be at desktop coordinates{' '}
            <code className="font-mono text-mono-data text-[var(--text-hi)]">(1840, 300)</code> regardless
            of what's on screen. So the creature has <strong className="font-medium text-[var(--text-hi)]">one
            position in global desktop coordinates</strong>, owned by the main process and ticked at ~30Hz,
            broadcast over IPC to every renderer. Inside a Hatch window, that window draws it; outside, the
            main process spawns transparent click-through overlay windows at its location and those draw it
            instead. The fiddly parts were all at the seams: spawn margins so overlays don't appear under
            the cursor, debouncing so a creature loitering at a window edge doesn't thrash overlays in and
            out, and dedupe so two surfaces never draw the same creature at once.
          </p>
          <Figure
            src="/media/hatch/hatch-faces.png"
            ratio="2/1"
            alt="Eight demeanours composited on one body, labelled"
            caption="Eight demeanours, one body — faces are composited at runtime"
            tint="var(--tint-hatch)"
            size="1200×600"
          />
        </ProseBlock>
      </>
    ),
    after: (
      <>
        <ProseBlock title="Decisions" wide>
          <div className="space-y-6">
            <Decision title="The simulation engine is pure.">
              <p>
                It takes events and produces state, knowing nothing about Electron or SQLite — which is
                what makes a 30-day life cycle testable: you feed it 30 days of events in a loop instead of
                waiting a month.
              </p>
            </Decision>
            <Decision title="Security locked down.">
              <p>
                <code className="font-mono text-mono-data text-[var(--text-hi)]">contextIsolation</code> on,{' '}
                <code className="font-mono text-mono-data text-[var(--text-hi)]">nodeIntegration</code> off,
                renderer sandboxed, strict CSP, and every asset served through a custom{' '}
                <code className="font-mono text-mono-data text-[var(--text-hi)]">hatch-asset:</code>{' '}
                protocol handler rather than opening up{' '}
                <code className="font-mono text-mono-data text-[var(--text-hi)]">file://</code> — necessary
                because generated art means loading images written at runtime.
              </p>
            </Decision>
            <Decision title="Migrations versioned, database copied before each one runs." />
            <Decision title="Faces composited at runtime, not baked.">
              <p>
                Art generation emits faceless bodies plus a face-anchor table, and all eight demeanours are
                drawn from that single source, so a mood change never repaints existing art. A check script
                asserts every face pixel lands on the body.
              </p>
            </Decision>
            <Decision title="Session detection with a docked fallback.">
              <p>
                Positioning windows at arbitrary screen coordinates works on X11 and XWayland and is
                restricted under native Wayland, so the app detects the session type and keeps the creature
                in its own window there. Everything else is identical.
              </p>
            </Decision>
          </div>
        </ProseBlock>
        <ProseBlock title="Rough edges">
          <p>
            The AI sidecar's real-model path is written and wired but not validated end to end; mock mode
            is solid. Palette customisation is a hue-rotate tint rather than true indexed-colour palette
            swapping. Analytics are CSS bar charts.
          </p>
        </ProseBlock>
        <ProseBlock title="What I'd do differently">
          <p>
            The plan was to generate pixel art with a local diffusion model. It largely failed, for a
            specific reason — general-purpose image models produce <em>images that look like</em> pixel
            art: approximately-aligned blocks, anti-aliased edges, a palette that drifts between
            generations. Pixel art needs exact boundaries and a fixed palette, and sprite sheets need
            frame-to-frame consistency that independently sampled output can't give you. It works for
            one-off static assets and not for anything on a sprite sheet. The mistake was choosing a
            general-purpose tool for a problem with hard structural constraints.
          </p>
          <Figure
            src="/media/hatch/hatch-lifecycle.png"
            ratio="4/1"
            alt="The four life stages: egg, infant, mature, old"
            caption="Egg → infant → mature → old"
            tint="var(--tint-hatch)"
            size="1600×400"
          />
        </ProseBlock>
      </>
    ),
  },

  /* ------------------------------------------------------ probe-sniffer */
  'probe-sniffer': {
    before: (
      <>
        <ProseBlock title="Why it exists">
          <p>
            I was supervising in a bar and my manager would text asking how busy we were, which meant
            guessing or walking the floor and counting, several times a night. I'd just watched a video on
            802.11 probe requests and wondered whether the answer could be measured instead: phones
            constantly broadcast probes looking for known networks, in the clear. Count the distinct
            senders, get a rough headcount, no cameras and nothing anyone has to opt into.
          </p>
        </ProseBlock>
        <ProseBlock title="The hard part">
          <p>
            Counting unique MAC addresses gives a wildly wrong answer. Since iOS 8 and Android 8 phones
            probe with a randomised, locally-administered MAC and rotate it regularly, so over a few
            minutes one phone presents a dozen addresses. Naive counting doesn't overestimate slightly — it
            produces a number that climbs for as long as you keep listening, whether or not anyone new
            walked in. The fix is to key on something the phone can't randomise: the set of information
            elements each probe carries, and the order they appear in, which is a property of the chipset
            and driver rather than the address. So the cluster key is the MAC when it looks universally
            administered or the probe carried too few IEs to discriminate, and the IE fingerprint when the
            MAC is locally administered. One phone rotating through twenty addresses collapses to one
            cluster.
          </p>
        </ProseBlock>
        <ProseBlock title="The floor of the technique">
          <p>
            Stated because it matters more than the result: two identical handsets on the same OS version
            fingerprint alike and merge into one. That undercount is inherent, not a bug. The output is
            "roughly how busy is this space", not a census.
          </p>
        </ProseBlock>
      </>
    ),
    after: (
      <>
        <ProseBlock title="Decisions" wide>
          <div className="space-y-6">
            <Decision title="pyshark first, then rewritten on scapy.">
              <p>
                pyshark first, because it parses 802.11 thoroughly — then rewritten on scapy, because
                pyshark wraps tshark which wraps Wireshark's dissectors, and bugs were surfacing below my
                code where I couldn't reproduce or fix them.
              </p>
            </Decision>
            <Decision title="Both backends behind a shared interface.">
              <p>
                Rather than delete the pyshark work I put both behind a shared{' '}
                <code className="font-mono text-mono-data text-[var(--text-hi)]">SnifferBackend</code>{' '}
                interface; that abstraction is the residue of switching, not up-front design, and pyshark
                is still useful as a cross-check.
              </p>
            </Decision>
            <Decision title="More time went into working out what to ignore than what to capture." />
          </div>
        </ProseBlock>
        <ProseBlock title="Legal and ethical">
          <p>
            MAC addresses are personal data under UK/EU GDPR, and fingerprint clustering makes that
            stronger rather than weaker — the entire point of it is re-identifying a device across
            randomisation introduced specifically to prevent tracking. It listens only, never transmits,
            associates or touches payloads, and it writes nothing to disk. I never deployed it in the bar;
            the questions above are a large part of why.
          </p>
        </ProseBlock>
        <ProseBlock title="Rough edges">
          <p>
            No persistence, no time-series output, nothing beyond the terminal. No tests — the tracker is
            pure functions over synthetic probe events and is the obvious place to start. Accuracy has
            never been validated against a known headcount over a long period.
          </p>
        </ProseBlock>
      </>
    ),
  },

  /* --------------------------------------------------------- hal-voice */
  'hal-voice': {
    before: (
      <>
        <ProseBlock title="Why it exists">
          <p>
            I watched <em>2001: A Space Odyssey</em> and wanted to know how close I could get to the voice.
            It turned into something useful because Hal — a local Claude Code setup with an Obsidian vault
            as memory — was already sitting there wanting a better interface than a terminal. Once it
            worked, talking to it genuinely beat typing for quick questions.
          </p>
        </ProseBlock>
        <ProseBlock title="The hard part">
          <p>
            A local model generates slowly, and speech makes that unbearable. The naive pipeline — capture,
            transcribe, generate the whole reply, synthesise, play — puts several seconds of complete
            silence in the middle. Silence is much worse in a voice interface than on screen: you can watch
            text stream, but you can't watch nothing happen, and after two seconds you assume it's broken.
            So the reply is streamed and pipelined: Claude Code runs headless for structured incremental
            output, the output is split into sentences as it arrives, sentence one goes to the synthesiser
            while the model is still writing sentence two, and audio starts as soon as the first sentence
            is synthesised. First audio lands about as fast as the model can finish one sentence. That
            single change is the difference between the project feeling broken and feeling alive. Barge-in
            matters for the same reason — a machine that can't be interrupted is irritating to use. STT
            runs on CPU deliberately, so the whole GPU stays free for the language model and TTS.
          </p>
          <Figure
            src="/media/hal-voice/hal-voice-interface.png"
            ratio="1/1"
            alt="The pygame lens window, idle"
            caption="The pygame window, idle"
            tint="var(--tint-halvoice)"
            maxWidth="380px"
          />
        </ProseBlock>
      </>
    ),
    after: (
      <>
        <ProseBlock title="The voice">
          <p>
            GPT-SoVITS fine-tuned on supplied clips, then a client-side FX chain: EQ voicing, a small dry
            cabin reverb, loudness matching. The clone gets timbre; it doesn't get the room, the pacing or
            the weight. Three of the FX parameters ended up at zero, and finding that out took longer than
            building the chain. The one worth reading about is{' '}
            <code className="font-mono text-mono-data text-[var(--text-hi)]">pitch_flatten</code>: it
            reconstructs audio from the Hilbert analytic signal, which is only valid for narrowband signals
            — speech is broadband, so it was smearing artefacts across the whole spectrum. Everything
            sounded fried and I spent a while assuming the clone was bad. Synthesising one line with the FX
            bypassed took thirty seconds and settled it. I now reach for the bypass test first.
          </p>
          <Figure
            src="/media/hal-voice/fx-compare.png"
            ratio="14/5"
            alt="Waveform and spectrogram comparison: raw clone, the fried pitch_flatten output, and the final chain"
            caption="Raw clone / “fried” pitch_flatten / final"
            tint="var(--tint-halvoice)"
            size="1400×500"
          />
        </ProseBlock>
        <ProseBlock title="Rough edges">
          <p>
            The wake word is implemented against openWakeWord but doesn't reliably trigger and is off by
            default; push-to-talk is the only activation path I'd claim works. It's still slow — better
            than the naive pipeline by a long way, but there's a floor to how much streaming can hide.
            Barge-in can clip the first syllable. Linux only.
          </p>
        </ProseBlock>
        <ProseBlock title="On the voice itself">
          <p>
            HAL was performed by the late Douglas Rain. This ships the pipeline, not the performance — no
            audio, no transcripts and no trained weights, and the fetch script deliberately won't pull
            audio from a public host, because moving a recording to a different URL doesn't change who owns
            it.
          </p>
        </ProseBlock>
      </>
    ),
  },

  /* --------------------------------------------------------------- hal */
  hal: {
    before: (
      <>
        <ProseBlock title="Why it exists">
          <p>
            An experiment in how far 24GB of consumer GPU actually goes: I pointed Claude Code at
            Qwen3-Coder — the best coding model that fits the VRAM budget — and used it for real work to
            find where it fell over. What it needed next was somewhere to keep what it learned, and I
            already had an Obsidian vault, so it grew into something that organises the vault and reads
            from it.
          </p>
        </ProseBlock>
        <ProseBlock title="The hard part">
          <p>
            A 32K context window is small, and it's shared between input and output. Everything you load as
            background is context the actual work doesn't get, so the design question throughout is: what
            is the least context that makes this answer good? That produced a memory system with three
            tiers rather than one — durable facts in a capped{' '}
            <code className="font-mono text-mono-data text-[var(--text-hi)]">CLAUDE.md</code> that archives
            itself past ~280 lines, session <em>summaries</em> rather than transcripts, and a resume
            command that loads three logs by default rather than everything. And retrieval instead of
            stuffing: the vault is embedded, only the closest passages are retrieved, and the model is
            constrained to answer from those passages only, citing each as an Obsidian{' '}
            <code className="font-mono text-mono-data text-[var(--text-hi)]">[[wikilink]]</code>, or to say
            plainly that the notes don't cover it. That constraint is what makes the answers trustworthy —
            without it a small model blends your notes with its training data and you can't tell which is
            which.
          </p>
          <Figure
            src="/media/hal/architecture.svg"
            ratio="16/9"
            alt="Architecture: the hal launcher drives Claude Code and Ollama; slash commands work the vault; vault-index builds the .rag vectors read by ask and the MCP server"
            caption="launcher → Claude Code → Ollama · commands → vault · index → .rag → ask / MCP"
            tint="var(--tint-hal)"
          />
        </ProseBlock>
      </>
    ),
    after: (
      <>
        <ProseBlock title="The biggest quality improvement">
          <p>
            <strong className="font-medium text-[var(--text-hi)]">
              The single biggest quality improvement was a content decision, not a model one.
            </strong>{' '}
            Indexing everything made results worse: dashboards, index shells and empty stubs are short and
            mention every topic in the vault, so they score well against almost any query while containing
            nothing. The indexer skips them.
          </p>
        </ProseBlock>
        <ProseBlock title="Rough edges">
          <p>
            Retrieval quality depends heavily on how well-written the vault is; garbage notes retrieve as
            garbage. The import pipeline is batched but still slow on a large old vault. It's built around
            Claude Code as the harness, which was the fastest route to something usable but couples the
            project to a specific CLI — a purpose-built agent loop would give more control over exactly
            what enters the context window, and is the most likely direction for the next version.
          </p>
        </ProseBlock>
      </>
    ),
  },

  /* ------------------------------------------------ cxr (gated) */
  'cxr-zeroshot-segmentation': {
    before: (
      <>
        <ProseBlock title="Why it exists">
          <p>
            Can a vision-language model that was never trained to segment anything be made to localise
            pathology in a chest X-ray, using only text? Partly — and the interesting result is which of
            the obvious ideas turn out to be wrong.
          </p>
          <p>
            MSc-level dissertation work: CLIP-style models learn a joint image-text space, which suggests
            you should be able to point at "pleural effusion" in text and get a heatmap over the matching
            pixels. In practice a naive cosine heatmap between a text embedding and patch embeddings is
            close to useless on radiographs. The project works through <em>why</em>, and what has to be
            added: latent concept vectors extracted from the text tower, compositional structure in the
            embedding space, anatomical conditioning from a lung and heart segmentation prior, and a light
            region-pooling adapter.
          </p>
        </ProseBlock>
        <ProseBlock title="The framing">
          <p>
            Every component is set up as a test that could fail rather than a demo of something that works,
            with an ablation capable of answering "no". Several answer no. The wrong-anatomy ablation
            exists specifically to check that anatomical conditioning helps for the reason claimed rather
            than acting as a generic prior — swap left and right and see whether performance degrades the
            way it should.
          </p>
          <Figure
            src="/media/cxr/overlays.png"
            ratio="16/9"
            alt="Predicted masks over a grid of radiographs"
            caption="Predicted mask over radiograph grid — DUA check before publication"
            tint="var(--tint-cxr)"
            size="1600×900"
          />
        </ProseBlock>
        <ProseBlock title="Engineering worth noting">
          <p>
            A patient-ID leakage guard as a hard assertion, because patients appear across multiple studies
            and a naive split silently inflates every number. Config-signature caching so changing one
            parameter recomputes only the affected cells. Memory management as a first-class concern —
            several backbones and a diffusion-scale model don't coexist in 24GB by accident. Automatic
            provenance: every experiment cell writes its numbers to CSV and its figures to disk, so
            nothing in the write-up is a screenshot of a value nobody can reproduce.
          </p>
        </ProseBlock>
        <ProseBlock title="Results" wide>
          <p className="max-w-[68ch]">Numbers pending the final run.</p>
          <div className="overflow-x-auto">
            <table className="w-full max-w-[68ch] border-collapse font-mono text-mono-data">
              <thead>
                <tr className="border-b border-[var(--line-2)] text-left text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">
                  <th className="py-2 pr-4 font-medium">Configuration</th>
                  <th className="py-2 pr-4 font-medium">Dice</th>
                  <th className="py-2 pr-4 font-medium">IoU</th>
                  <th className="py-2 pr-4 font-medium">Pointing game</th>
                  <th className="py-2 font-medium">Lateralisation</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-md)]">
                {[
                  'Naive cosine baseline',
                  '+ latent concept vectors',
                  '+ anatomy conditioning',
                  '+ region-pooling adapter',
                ].map(row => (
                  <tr key={row} className="border-b border-[var(--line)]">
                    <td className="py-2 pr-4">{row}</td>
                    <td className="py-2 pr-4">—</td>
                    <td className="py-2 pr-4">—</td>
                    <td className="py-2 pr-4">—</td>
                    <td className="py-2">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Figure
            src="/media/cxr/ablation.png"
            ratio="14/9"
            alt="Ablation waterfall"
            caption="Ablation waterfall"
            tint="var(--tint-cxr)"
            size="1400×900"
          />
        </ProseBlock>
      </>
    ),
    after: (
      <>
        <ProseBlock title="Rough edges">
          <p>
            It's one large notebook; the helper cells want to be a{' '}
            <code className="font-mono text-mono-data text-[var(--text-hi)]">src/</code> package with the
            notebook as a thin narrative layer. Some ablations are cached rather than routinely re-run. The
            failure-mode taxonomy is hand-labelled over a sample.
          </p>
        </ProseBlock>
        <ProseBlock title="Data and ethics">
          <p>
            De-identified public research corpora used under their DUAs. No image data, patient metadata,
            derived masks or weights are published, and notebook outputs are stripped before commit.
          </p>
        </ProseBlock>
      </>
    ),
  },

  /* -------------------------------------------------- canvas-downloader */
  'canvas-downloader': {
    before: (
      <>
        <ProseBlock title="Why it exists">
          <p>
            Archives every file from every Canvas course into sorted folders — including the ones that only
            exist as links buried in page text and vanish when a course is unpublished.
          </p>
        </ProseBlock>
        <ProseBlock title="The one part that isn't obvious">
          <p>
            Pulling the Files tab is a paginated API call. The problem is that a lot of material never
            appears in the Files tab at all: lecturers link files inline in page text, assignments and
            announcements. Those files may sit in folders you can't list and are the most likely thing to
            disappear, so the script fetches every page, assignment and announcement, scrapes{' '}
            <code className="font-mono text-mono-data text-[var(--text-hi)]">/files/&lt;id&gt;</code>{' '}
            references out of the HTML and resolves each through the API separately. In practice they're a
            meaningful share of what a course contains.
          </p>
          <Figure
            src="/media/canvas/linked-files.png"
            ratio="4/3"
            alt="Files resolved out of page HTML, sorted into course folders"
            caption="Linked materials resolved out of page HTML — course names are placeholders"
            tint="var(--tint-util)"
            size="1200×900"
          />
        </ProseBlock>
      </>
    ),
    after: (
      <ProseBlock title="Honest scale">
        <p>
          A single-file script written in an afternoon — no tests, no packaging, no flags beyond the
          constants at the top. That's proportionate to what it is. The interesting part isn't the code,
          it's that it completes the Hal ecosystem.
        </p>
      </ProseBlock>
    ),
  },

  /* ------------------------------------------------- jupyter-tts-alerts */
  'jupyter-tts-alerts': {
    before: (
      <>
        <ProseBlock title="Why it exists">
          <p>
            Your notebook tells you out loud when a cell finishes, how long it took, and whether it fell
            over — so you can leave the desk during a six-hour run.
          </p>
          <p>
            Dissertation runs took six hours or more, and I spent a lot of that at the desk checking
            whether it was still alive or had died on cell 9 forty minutes ago. I'd heard that Pixar's
            render farm played animal noises as jobs completed, so the room told you how the render was
            going without anyone watching a screen. Same problem.
          </p>
        </ProseBlock>
        <ProseBlock title="Design">
          <p>
            Non-intrusive by design: cells under five seconds say nothing, so you aren't narrated at while
            iterating; errors always announce regardless of runtime, in a{' '}
            <strong className="font-medium text-[var(--text-hi)]">different voice</strong>. The different
            voice matters more than it sounds — if everything is one voice you have to parse the sentence
            to know whether it went well.
          </p>
          <Figure
            src="/media/jupyter/behaviour.png"
            ratio="3/2"
            alt="The announcement rules by cell runtime"
            caption="Announcement rules by cell runtime"
            tint="var(--tint-util)"
            size="1200×800"
          />
        </ProseBlock>
      </>
    ),
    after: null,
  },
}
