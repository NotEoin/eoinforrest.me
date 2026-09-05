import { ReactNode } from 'react'
import ProseBlock, { Code, Decision, Key } from '../components/ProseBlock'
import Figure from '../components/Figure'

/**
 * The long-form prose for every project page, kept in step with each
 * repository's README so the site and the repo never drift apart.
 *
 * `before` opens the write-up (why it exists, the hard part);
 * `after` closes it (decisions, what didn't work, current state).
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
            <em>Stormworks: Build and Rescue</em> is a physics sandbox where you program vehicle
            microcontrollers in Lua. I wanted a boat that could be given a destination and get there on its
            own, reading the world through laser rangefinders.
          </p>
          <p>
            There was no navigation library to reach for. The game hands you a GPS readout, a compass and
            some laser distance sensors; it does not hand you pathfinding, an occupancy grid, or any notion
            of “get me over there”. In Stormworks you either build the map, the search and the helm
            controller yourself, or you drive the boat.
          </p>
        </ProseBlock>
        <ProseBlock title="The hard part">
          <p>
            Two limits shaped almost every decision in the repository, and they pulled in opposite
            directions. <Key>Scripts were capped at 4096 characters</Key> — characters, including whitespace,
            not kilobytes and not lines. <Key>And the engine runs logic at 60Hz and drops a script that
            overruns its tick.</Key> So the code had to be both physically small and cheap to execute, and the
            obvious implementation of almost anything is one or the other but rarely both.
          </p>
          <p>
            The A* search is incremental, resumed across ticks, because a complete search fits in neither
            one tick nor the character budget. The obstacle table is keyed on the string <Code>"x,y"</Code>{' '}
            because <Code>obstacles[x..","..y]</Code> is dramatically shorter to write than the nested-table
            equivalent <em>and</em> faster to probe. The system runs on two microcontrollers because it
            stopped fitting in one — a stabiliser that keeps the beams level, and a navigator that maps,
            searches, steers and draws, joined by a single composite wire so the timing-critical gimbal work
            stays isolated from everything that can afford a tick of lag.
          </p>
          <p>
            Then I ran out of room. The project sat unfinished for months — not because the remaining
            features were hard, but because there was physically no space left to express them. A game
            update raised the cap to 8192 and it restarted the same week. Side lasers, spline following and
            the ghost track all came after that. I don’t think I’d have written it the same way with 8192
            from the start, and it would probably have been worse.
          </p>
          <Figure
            src="/media/lidar/debug-annotated.png"
            ratio="1200/653"
            alt="The in-game debug screen, annotated: planned route, predicted track, laser beams, mapped bank and the boat"
            caption="The debug screen — planned route, predicted track, beams, mapped bank, the boat"
            tint="var(--tint-lidar)"
            size="1200×653"
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
                Movement is 8-connected, so octile distance is the <em>exact</em> cost of an unobstructed
                path while Euclidean underestimates it. An admissible-but-loose heuristic still finds the
                optimal path — it just expands far more nodes getting there, which on a tick budget means
                visibly slower replanning.
              </p>
            </Decision>
            <Decision title="Diagonal corner-cutting rejected.">
              <p>
                A diagonal hop is “pinched” if either flanking orthogonal cell is occupied; pinched hops are
                dropped. Without this the boat plots a course through the gap between two rocks and drives
                into both.
              </p>
            </Decision>
            <Decision title="Clearance penalty in the cost function.">
              <p>
                A geometrically optimal path that clips scenery on every corner is not optimal for a boat
                with momentum. The search pays a penalty for hugging obstacles, so it prefers the middle of
                a channel.
              </p>
            </Decision>
            <Decision title="Gimbals solved in the body frame.">
              <p>
                The stabiliser reads attitude and drives six laser pivots from the <em>same tick’s</em>{' '}
                attitude. One tick of lag smears the beams during fast roll and drops phantom obstacles into
                the map. Solving in the body frame also means the lasers stay level through a complete
                capsize.
              </p>
            </Decision>
          </div>
        </ProseBlock>
        <ProseBlock title="What didn't work">
          <p>
            <Key>Pure pursuit replaced string-pulling, and the symptom took a while to read correctly.</Key>{' '}
            Early versions steered at the next visible node on the path. On any boat with a real turning
            circle the helm sawed back and forth, and I first assumed the path itself was noisy. It wasn’t —
            by the time the boat responded to a heading command it had already passed the point it was
            aiming at, so it was permanently correcting toward a target behind it. The fix was to stop
            aiming at nodes altogether: project the boat onto the corridor polyline and aim at a carrot a
            set distance further along it, with the look-ahead scaling with speed. The sawing disappeared
            entirely.
          </p>
          <p>
            <Key>Path tree rebasing was removed.</Key> It was an optimisation to reuse the previous search’s
            tree after the target moved. It cost more characters than it saved ticks, which under a
            4096-character cap is a straightforward loss.
          </p>
        </ProseBlock>
        <ProseBlock title="Current state">
          <p>
            <Key>Works and verified in-game:</Key> autonomous point-to-point navigation with live replanning
            around discovered obstacles, beam stabilisation holding through a full capsize, and the debug
            map including the predicted ghost track.
          </p>
          <p>
            <Key>Deliberately deferred:</Key> it isn’t on the Steam Workshop yet — a ready-to-use vehicle
            release is planned once performance tuning is finished, so for now you wire it into your own
            build. Smoothing is corner-merging plus pure pursuit rather than a proper spline, which is good
            enough that a spline hasn’t earned its characters.
          </p>
          <p>
            <Key>Known rough edges:</Key> <Code>isObstructed()</Code> is called more often than it needs to be, and
            that’s the next optimisation. Detection is 2D, so overhanging obstacles are invisible to it —
            fine for boats, wrong for aircraft. The helm output assumes a single rudder and throttle, so
            it’s boats only.
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
            I wanted to track my own mood and knew I wouldn’t stick with a form. The mechanic came from a
            websocket demo that syncs a sprite across browser windows so it can walk between them; I pulled
            it apart to understand it, then wondered what it would be as a real desktop application rather
            than a browser toy — a creature that treats your whole screen as its world.
          </p>
          <p>
            Once the creature can leave the window, the check-in stops being a notification you dismiss and
            becomes something that walks over to you. <Key>That reframing is the entire product idea.</Key>
          </p>
          <p>
            Underneath it is a rule the simulation obeys in code rather than just in documentation:{' '}
            <Key>Hatch responds to care and consistency, never to whether you reported a good day.</Key> A hard
            day is logged data. It cannot make your creature unwell, and the creature can never die of
            neglect — it naps until you come back.
          </p>
        </ProseBlock>
        <ProseBlock title="The hard part">
          <p>
            Electron gives you windows. It does not give you a sprite that can be at desktop coordinates{' '}
            <Code>(1840, 300)</Code> regardless of what’s on screen. So the creature has{' '}
            <Key>one position in global desktop coordinates</Key>, owned by the main process, ticked at ~30Hz
            and broadcast over IPC to every renderer. Inside a Hatch window, that window draws it; outside,
            the main process spawns transparent click-through overlay windows at its location and those
            draw it instead.
          </p>
          <p>
            The interesting work was all at the seams, not in the idea: spawn margins so overlays don’t
            appear directly under the cursor, debouncing so a creature loitering at a window edge doesn’t
            thrash overlays in and out, and dedupe so two surfaces never draw the same creature at once.
          </p>
          <p>
            The creature also has eight demeanours, composed at runtime from anchor points rather than drawn
            as separate sprites — so any palette, pattern or accessory wears every expression without new
            art.
          </p>
          <Figure
            src="/media/hatch/hatch-faces.png"
            ratio="1000/744"
            alt="Eight demeanours composited on one body, labelled"
            caption="Eight demeanours, one body — faces are composited at runtime"
            tint="var(--tint-hatch)"
            size="1000×744"
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
                It takes events and produces state, knowing nothing about Electron or SQLite. That is what
                makes a 30-day life cycle testable: you feed it 30 days of events in a loop instead of
                waiting a month.
              </p>
            </Decision>
            <Decision title="Security locked down properly.">
              <p>
                <Code>contextIsolation</Code> on, <Code>nodeIntegration</Code> off, renderer sandboxed, strict CSP, and
                every asset served through a custom <Code>hatch-asset:</Code> protocol handler rather than opening
                up <Code>file://</Code> — necessary because generated art means loading images written at runtime.
              </p>
            </Decision>
            <Decision title="Migrations versioned, database copied before each one runs.">
              <p>
                A backup is taken before any migration executes, so a bad migration costs a restore rather
                than the user’s history.
              </p>
            </Decision>
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
        <ProseBlock title="What didn't work">
          <p>
            <Key>
              The plan was to generate all the pixel art with a local diffusion model. It largely failed,
              and the reason is specific.
            </Key>{' '}
            General-purpose image models produce <em>images that look like</em> pixel art:
            approximately-aligned blocks, anti-aliased edges, and a palette that drifts between generations.
            Pixel art needs exact block boundaries and a fixed palette. Sprite sheets need frame-to-frame
            consistency that independently sampled output cannot give you — every frame is a fresh sample,
            so the creature subtly changes shape as it walks. It works acceptably for one-off static assets
            and poorly for anything on a sprite sheet.
          </p>
          <p>
            <Key>The mistake was choosing a general-purpose tool for a problem with hard structural
            constraints.</Key>{' '}
            That’s the transferable lesson, and it’s why the runtime face-composition system exists: it gets
            guaranteed consistency from one anchor table instead of hoping a sampler stays on-model.
          </p>
          <Figure
            src="/media/hatch/hatch-lifecycle.png"
            ratio="4/1"
            alt="The four life stages: egg, infant, mature, old"
            caption="Egg → infant → mature → old, then the Meadow and a new egg"
            tint="var(--tint-hatch)"
            size="1600×400"
          />
        </ProseBlock>
        <ProseBlock title="Current state">
          <p>
            <Key>Works:</Key> the main interface, check-ins, the 30-day simulation, progression, Meadow and
            analytics; desktop roaming on X11 and XWayland; and mock-mode AI, which returns instant
            placeholder responses with nothing downloaded.
          </p>
          <p>
            <Key>Deliberately deferred:</Key> there’s no packaged installer yet — no AppImage or <Code>.deb</Code>, so
            you run it from source. Analytics are CSS bar charts, which are adequate for a 30-day window
            where a charting library would be weight for little gain.
          </p>
          <p>
            <Key>Known rough edges:</Key> native Wayland gets docked mode, so the creature won’t leave its
            window. The AI sidecar’s real-model path is written and wired but not validated end to end —
            mock mode is solid and is the better experience. Palette customisation is a hue-rotate tint
            rather than true indexed-colour palette swapping, and some compositors have transparency quirks.
          </p>
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
            guessing, or walking the floor and counting, several times a night. I’d just watched a video on
            802.11 probe requests and wondered whether the answer could be <em>measured</em> instead.
          </p>
          <p>
            Phones constantly broadcast probe requests looking for networks they know. Those broadcasts are
            unencrypted and carry a sender address, so counting distinct senders gives you a rough headcount
            of the radios nearby — no cameras, and nothing anyone has to opt into.
          </p>
        </ProseBlock>
        <ProseBlock title="The hard part">
          <p>
            <Key>Counting unique MAC addresses gives a wildly wrong answer.</Key> Since iOS 8 and Android 8,
            phones probe with a randomised, locally-administered MAC and rotate it regularly, so over a few
            minutes one phone presents a dozen addresses. Naive counting doesn’t overestimate slightly — it
            produces a number that climbs for as long as you keep listening, whether or not anyone new
            walked in. It is not a noisy version of the right answer; it is not an answer at all.
          </p>
          <p>
            <Key>The fix is to key on something the phone can’t randomise.</Key> A probe request carries a set
            of <em>information elements</em> — supported rates, capability flags, HT/VHT parameters, and the
            order they appear in. That combination is a property of the chipset and driver rather than the
            address, and it survives rotation. So the cluster key is the MAC when it looks universally
            administered or the probe carried too few IEs to discriminate, and the IE fingerprint when the
            MAC is locally administered. One phone cycling through twenty addresses collapses to a single
            device.
          </p>
        </ProseBlock>
        <ProseBlock title="The floor of the technique">
          <p>
            Stated because it matters more than the result:{' '}
            <Key>two identical handsets on the same OS version fingerprint alike and merge into one.</Key> That
            undercount is inherent to the approach, not a bug in this implementation. The output is{' '}
            <em>roughly how busy is this space</em>, not a census — and nothing in the figure above can tell
            you how large that gap was, because a real room offers no ground truth to check against.
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
                pyshark came first because it parses 802.11 thoroughly. It was dropped as the default
                because it wraps <Code>tshark</Code>, which wraps Wireshark’s dissectors — so a capture passes
                through several layers before reaching Python, and the bugs that surfaced were mostly in
                layers I couldn’t reproduce in isolation or fix. scapy parses frames in-process, which made
                it possible to pull the information elements out directly and actually debug what was
                happening.
              </p>
            </Decision>
            <Decision title="Both backends kept behind a shared interface.">
              <p>
                Rather than delete the pyshark work, both sit behind a shared <Code>SnifferBackend</Code>{' '}
                interface. That abstraction is <Key>the residue of switching, not up-front design</Key> — but
                pyshark stayed useful, because <Code>tshark</Code> parses IEs more thoroughly on malformed frames,
                which makes it a good second opinion.
              </p>
            </Decision>
            <Decision title="More time went into working out what to ignore than what to capture.">
              <p>
                Beacons, probe responses, data frames, retransmissions and the adapter’s own traffic all
                have to go before you have a signal at all.
              </p>
            </Decision>
          </div>
        </ProseBlock>
        <ProseBlock title="Legal and ethical">
          <p>
            Probe requests are broadcast in the clear and this tool only listens. That does not make the
            data harmless. <Key>MAC addresses are personal data under UK and EU GDPR</Key> — they identify a
            device, and a device usually identifies a person. The fingerprint clustering here makes that
            stronger, not weaker: its whole purpose is re-identifying a device across the randomisation
            introduced specifically to prevent tracking.
          </p>
          <p>
            So it listens only — never transmitting, associating, deauthenticating or touching packet
            contents — and it writes nothing to disk, which is a privacy decision rather than an omission;
            adding persistence needs a lawful basis first. Deployed anywhere the public passes through, this
            is processing personal data at scale: you need a lawful basis, a privacy notice and most likely
            a DPIA, and “it’s only a count” is not a defence. I never deployed it in the bar; these
            questions are a large part of why.
          </p>
        </ProseBlock>
        <ProseBlock title="Current state">
          <p>
            <Key>Works:</Key> live device counting on a monitor-mode adapter, with the clustering doing what it
            claims, on both backends — plus a <Code>--no-fingerprint</Code> comparison mode so you can watch the
            raw MAC count climb while the device count holds steady. That comparison is the figure above,
            run against fifteen minutes of one real room: <Key>257 distinct addresses, and around thirty
            devices throughout.</Key> The tracker and both backends are covered by a test suite that crafts
            probe requests in memory, so it runs without an interface, monitor mode or root.
          </p>
          <p>
            <Key>Known rough edges:</Key> accuracy is unvalidated against a known headcount — it is clearly
            better than raw MAC counting, but <em>how much</em> better is an open question. Output is terminal
            only, with no time series or dashboard, and it needs monitor-mode-capable hardware, which rules
            out most laptops without a USB adapter.
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
          </p>
          <p>
            It turned into something useful because Hal — a local Claude Code setup with an Obsidian vault
            as memory — was already sitting there wanting a better interface than a terminal. Once it
            worked, talking to it genuinely beat typing for quick questions. hal-voice runs{' '}
            <Key>no model of its own</Key>: it is a voice on the front of a Claude Code session, so whatever
            that session can already do — your tools, your MCP servers, your project’s memory — it can now
            do out loud.
          </p>
        </ProseBlock>
        <ProseBlock title="The hard part">
          <p>
            <Key>A local model generates slowly, and speech makes that unbearable.</Key> The naive pipeline —
            capture, transcribe, generate the whole reply, synthesise, play — puts several seconds of
            complete silence in the middle. Silence is much worse in a voice interface than on screen: you
            can watch text stream, but you can’t watch nothing happen, and after two seconds you assume it’s
            broken.
          </p>
          <p>
            So the reply is streamed and pipelined. Claude Code runs headless for structured incremental
            output, the output is split into sentences as it arrives, sentence one goes to the synthesiser{' '}
            <Key>while the model is still writing sentence two</Key>, and audio starts as soon as that first
            sentence is synthesised. First audio lands about as fast as the model can finish one sentence
            rather than a whole reply. That single change is the difference between the project feeling
            broken and feeling alive.
          </p>
          <p>
            Barge-in matters for the same reason — a machine that can’t be interrupted is irritating to use.
            And speech recognition runs on CPU deliberately, so the whole GPU stays free for the language
            model and the synthesiser.
          </p>
          <Figure
            src="/media/hal-voice/hal-voice-interface.png"
            ratio="530/567"
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
        <ProseBlock title="The voice, and what didn't work">
          <p>
            GPT-SoVITS fine-tuned on supplied clips, then a client-side FX chain: EQ voicing, a small dry
            cabin reverb, loudness matching. The clone gets timbre; it doesn’t get the room, the pacing or
            the weight.
          </p>
          <p>
            <Key>Three of the FX parameters ended up at zero, and finding that out took longer than building
            the chain.</Key>{' '}
            The one worth reading about is <Code>pitch_flatten</Code>. It reconstructs audio from the Hilbert
            analytic signal — which is only valid for narrowband signals. Speech is broadband, so the
            resynthesised phase threw artefacts across the whole spectrum. Everything sounded fried, and I
            spent a while assuming the voice clone itself was bad. Synthesising one line with the FX
            bypassed took thirty seconds and settled it.
          </p>
          <p>
            In the middle panel below, the vertical streaks across every band are those reconstruction
            artefacts: spectral flatness rises from 0.0006 to 0.0010 and the harmonic-to-percussive energy
            ratio falls from 0.46 to 0.29. <Code>pitch_shift_semitones</Code> and <Code>drive</Code> went to zero for
            related reasons — both were compensating for a problem that wasn’t there.{' '}
            <Key>I now reach for the bypass test first.</Key> HAL’s monotone comes from the clone and a slow
            speed setting, not from post-processing.
          </p>
          <Figure
            src="/media/hal-voice/fx-compare.png"
            ratio="14/5"
            alt="Waveform and spectrogram comparison: raw clone, the fried pitch_flatten output, and the final chain"
            caption="Same line, three ways — raw clone / “fried” pitch_flatten / the shipped chain"
            tint="var(--tint-halvoice)"
            size="1400×500"
          />
        </ProseBlock>
        <ProseBlock title="Current state">
          <p>
            <Key>Works:</Key> the full push-to-talk loop, streaming synthesis, barge-in and the eye; MCP server
            mode, giving speak and listen inside an ordinary Claude Code session; and a <Code>doctor</Code>{' '}
            command, which catches the audio-device problems that cause most failures.
          </p>
          <p>
            <Key>Deliberately deferred:</Key> the wake word is off by default. The code is there and “Hey HAL”
            is configurable, but detection is unreliable, so its dependencies aren’t installed either.
            Push-to-talk is the supported way in.
          </p>
          <p>
            <Key>Known rough edges:</Key> it’s still slow — streaming hides a great deal, but there is a floor
            to how much it can hide, and on the CPU-only profile synthesis runs slower than real time, so
            HAL pauses before answering. Barge-in can clip the first syllable of your next sentence. The
            voice effects are tuned to one voice, so treat the defaults as a starting point. Linux only.
          </p>
        </ProseBlock>
        <ProseBlock title="On the voice itself">
          <p>
            HAL was performed by the late Douglas Rain, who did not consent to and could not have consented
            to this. This is non-commercial fan work, and it ships the pipeline rather than the performance
            — no training clips, no transcripts and no trained weights are distributed, and the fetch script
            deliberately refuses to pull audio from public hosts, because moving a recording to a different
            URL doesn’t change who owns it. In most jurisdictions a person’s voice is protected, and cloning
            one you have no rights to is not okay, whatever the tooling makes easy.
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
            An experiment in how far 24GB of consumer GPU actually goes. I pointed Claude Code at
            Qwen3-Coder — the best coding model that fits that VRAM budget — and used it for real work to
            find where it fell over. What it needed next was somewhere to keep what it learned, and I
            already had an Obsidian vault, so it grew into something that both organises the vault and reads
            from it.
          </p>
          <p>
            The vault is the point. Dump anything into the inbox and Hal files it into a cross-linked,
            indexed knowledge base — which then becomes the thing it searches when you ask it something.
          </p>
        </ProseBlock>
        <ProseBlock title="The hard part">
          <p>
            <Key>A 32K context window is small, and it’s shared between input and output.</Key> Everything you
            load as background is context the actual work doesn’t get, so the design question throughout is:{' '}
            <em>what is the least context that makes this answer good?</em>
          </p>
          <p>
            That produced a memory system with three tiers rather than one — durable facts in a capped{' '}
            <Code>CLAUDE.md</Code> that archives itself past ~280 lines, session <em>summaries</em> rather than
            transcripts, and a resume command that loads three logs by default rather than everything.
          </p>
          <p>
            And retrieval instead of stuffing: the vault is embedded, only the closest passages are
            retrieved, and the model is constrained to answer <em>from those passages only</em>, citing each
            as an Obsidian <Code>[[wikilink]]</Code> — or to say plainly that the notes don’t cover it. That
            constraint is what makes the answers trustworthy. Without it a small model blends your notes
            with its training data and you cannot tell which is which.
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
            <Key>The single biggest quality improvement was a content decision, not a model one.</Key> Indexing
            everything made results worse: dashboards, index shells and empty stubs are short and mention
            every topic in the vault, so they score well against almost any query while containing nothing
            useful. They crowded real notes out of the top-k. The indexer now skips them, and that single
            change did more for answer quality than any model or embedding swap.
          </p>
        </ProseBlock>
        <ProseBlock title="Privacy">
          <p>
            The embeddings and the index always run on your machine, in every profile — the vault is read,
            chunked and searched locally, and there is no hosted retrieval step. On the two GPU profiles
            nothing leaves the machine at all, because the model answering you is the one on your own GPU.
            On the no-GPU profile the answer is written by Claude Code, so the retrieved passages are sent
            along with the question: search stays local, the write-up does not. <Code>hal ask --no-llm</Code>{' '}
            returns the retrieved passages only.
          </p>
        </ProseBlock>
        <ProseBlock title="Current state">
          <p>
            <Key>Works:</Key> local answering with citations on both GPU profiles and CPU-only retrieval
            without one; the twelve slash commands, the memory tiers and the morning brief; and an MCP
            server usable from any MCP client.
          </p>
          <p>
            <Key>Deliberately deferred:</Key> it’s built around Claude Code as the harness. That was the
            fastest route to something usable and it couples the project to a specific CLI — a purpose-built
            agent loop would give more control over exactly what enters the context window, and that’s the
            most likely direction for the next version.
          </p>
          <p>
            <Key>Known rough edges:</Key> answers are only as good as your notes, and retrieval can’t rescue a
            vault full of empty stubs — garbage notes retrieve as garbage. Importing a large existing vault
            is slow even batched. A local 30B is not a frontier model: very capable at code, search and
            note-wrangling, and it will lose to a cloud model on hard multi-file reasoning. Linux only.
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
            I had my own lecture notes written up, but I wanted the <em>source</em> material as well — to
            feed the knowledge base behind Hal, which files anything dropped into its inbox into a
            cross-linked, indexed Obsidian vault. Course material is exactly the kind of thing worth being
            able to search four years later, and exactly the kind of thing Canvas quietly deletes when a
            course is unpublished.
          </p>
          <p>
            So this walks the Canvas REST API with a personal access token and pulls everything down in one
            pass — lecture slides, PDFs, page text and linked handouts — into tidy folders sorted by term
            and course, with a <Code>Course structure.md</Code> per course so you can tell what it covered a year
            later.
          </p>
        </ProseBlock>
        <ProseBlock title="The one part that isn't obvious">
          <p>
            Pulling the Files tab is a paginated API call, and that part is dull.{' '}
            <Key>The problem is that a lot of material never appears in the Files tab at all.</Key> Lecturers
            link files inline in page text, assignments and announcements — a bare{' '}
            <Code>{'<a href="/courses/123/files/8834514">slides</a>'}</Code> in the page body — and that file may
            not be listed under Files, may live in a folder you can’t browse, and is the most likely thing
            to disappear.
          </p>
          <p>
            So every page, assignment and announcement is fetched, <Code>/files/&lt;id&gt;</Code> references are
            extracted from the HTML, and each one is resolved separately through the API. In practice
            they’re a meaningful share of what a course actually contains.
          </p>
          <Figure
            src="/media/canvas/linked-files.png"
            ratio="1215/492"
            alt="Files resolved out of page HTML, sorted into course folders"
            caption="Linked materials resolved out of page HTML — course names are placeholders"
            tint="var(--tint-util)"
            size="1215×492"
          />
        </ProseBlock>
      </>
    ),
    after: (
      <ProseBlock title="Current state">
        <p>
          <Key>Works</Key> — it does the job it was written for, and has been run against a full multi-year
          account.
        </p>
        <p>
          <Key>Honest about scale:</Key> a single-file script written in an afternoon, with no tests, no
          packaging and no flags beyond the two constants at the top. That’s proportionate to what it is —
          the interesting part isn’t the code, it’s that it completes the Hal ecosystem.
        </p>
        <p>
          <Key>Known rough edges:</Key> Canvas deployments vary a lot. Institutions disable endpoints, rename
          things and set different permissions, so an instance that behaves oddly is likely and worth an
          issue.
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
            Written during my dissertation, where a single pass over the pipeline took six hours or more. I
            spent a lot of that at the desk checking whether it was still alive — or discovering it had died
            on cell 9, forty minutes earlier.
          </p>
          <p>
            The idea came from an anecdote about Pixar’s render farm during <em>Toy Story</em>, where
            machines were set to play animal noises as jobs completed. The room told you how the render was
            going without anyone watching a screen. Same problem, much smaller scale. It hooks IPython’s
            cell events, so nothing in your notebook has to change.
          </p>
        </ProseBlock>
        <ProseBlock title="The design decision that matters">
          <p>
            <Key>Non-intrusive by default.</Key> Cells under five seconds say nothing, so you aren’t narrated at
            while iterating. Errors always announce regardless of runtime.
          </p>
          <p>
            <Key>Errors use a different voice</Key>, and that matters more than it sounds. If everything is one
            voice you have to parse the sentence to know whether it went well — which means stopping what
            you’re doing and listening. A different voice tells you the outcome before the words arrive.
          </p>
          <Figure
            src="/media/jupyter/behaviour.png"
            ratio="1215/480"
            alt="The announcement rules by cell runtime"
            caption="Announcement rules by cell runtime"
            tint="var(--tint-util)"
            size="1215×480"
          />
        </ProseBlock>
      </>
    ),
    after: (
      <ProseBlock title="Current state">
        <p>
          <Key>Works</Key> — used daily through a dissertation’s worth of long runs, which is the only test that
          mattered at the time. It isn’t packaged yet: <Code>%run notebook_tts.py</Code> with the file alongside
          your notebook is clumsy, and proper <Code>pip install</Code> support is the main thing outstanding.
        </p>
        <p>
          <Key>Known rough edges:</Key> errors are announced twice, because <Code>set_custom_exc</Code> and{' '}
          <Code>post_run_cell</Code> both fire on a failing cell and each increments the counter — so a crash says
          “Error in cell 4” and then “Error in cell 5”. Cosmetic, but it also means the cell numbers drift
          after the first error. Engine detection looks for <Code>espeak-ng</Code>, <Code>espeak</Code> and{' '}
          <Code>spd-say</Code>, so it’s Linux only; macOS <Code>say</Code> and Windows SAPI would each be a small
          addition. Two distinct voices need <Code>espeak</Code> — on <Code>spd-say</Code>, success and failure sound
          the same.
        </p>
      </ProseBlock>
    ),
  },
}
