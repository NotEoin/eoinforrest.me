// Records the check-in demo: the Moodling rests facing you inside the Hatch
// window, walks out onto the desktop, wanders, comes back to the window and
// asks you to check in, then the check-in panel opens. It finishes on the
// exact pixel it started on, facing you, so the clip loops without a jump.
//
// The middle section — a tour of the other panels — is cut out to produce the
// short version, so you can ship either. Both cut points sit on held frames
// that are identical, so the join is invisible.
//
//   Xvfb :99 -screen 0 1920x1080x24 +extension Composite +extension RENDER &
//   HATCH_DIR=../hatch OUT_DIR=public/media/hatch node tools/hatch-capture/checkin.mjs
import {
  OUT, FFMPEG, sleep, makeEnv, freshProfile, workDir, launchApp, startScene, placeHabitat,
  driver, record, stopRecording, findLoop, encode, encodeSkipping, run, rmSync,
} from './lib.mjs'

const HABITAT = { x: 70, y: 250, width: 545, height: 600 }
const profile = freshProfile()
const work = workDir()
const env = makeEnv(profile)
const raw = `${work}/raw.mp4`

// ---- phase A: onboard, seed some history, set the mood ---------------------
{
  const app = await launchApp(env)
  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await sleep(2500)
  const state = await page.evaluate(async () => {
    const h = window.hatch
    await h.completeOnboarding().catch(() => {})
    await h.debug({ cmd: 'setStage', stage: 'mature' })
    // a month of history gives the analytics panel something real to draw
    await h.debug({ cmd: 'seedDemoData', days: 30 })
    // …and a check-in today keeps the creature 'active'. Without one the app
    // goes dormant after a stretch, which forces the demeanour to 'napping'
    await h.submitCheckIn({ mood: 4, emotionTags: ['calm'], energy: 3 })
    // deriveDemeanour: mood >= 58 and under the 'bright' threshold (mood 70 /
    // energy 60) lands on 'content' — "happy and settled"
    await h.debug({ cmd: 'setWellbeing', mood: 64, energy: 55, health: 80, social: 70 })
    await h.setSettings({ creatureScale: 2.0, aiIdleMinutes: 5, liveliness: 1 })
    const c = await h.getCreatureState()
    return { demeanour: c.demeanour, status: c.status, name: c.name }
  })
  console.log('creature:', JSON.stringify(state))
  if (state.demeanour !== 'content') {
    console.warn(`! wanted demeanour 'content' (happy and settled), got '${state.demeanour}'`)
  }
  await sleep(800)
  await app.close().catch(() => {})
  await sleep(1500)
}

// ---- phase B: the shoot ----------------------------------------------------
const scene = startScene(env)
await sleep(3500)

const app = await launchApp(env)
const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')
await sleep(3000)
await placeHabitat(app, HABITAT)
await page.evaluate(() => window.hatch.setSettings({ creatureScale: 2.0, aiIdleMinutes: 5, liveliness: 1 }))
await sleep(2500)

const { send, pos, walk, parkFacingDown } = driver(page)
const setMode = (m) => page.evaluate((mode) => window.hatch.setControlMode(mode), m)
const tab = async (name, settle = 1400) => {
  await page.evaluate((n) => window.hatch.openWindow(n), name)
  await sleep(settle)
}

/** Wait for the app's own behaviour to walk the creature home and settle it.
 *  visitOrRest parks it at the centre of the habitat and turns it to face the
 *  user, which is both the resting pose we want and the app being itself. */
async function settleAtRest(timeout = 30000) {
  const t0 = Date.now()
  let last = null
  let still = 0
  while (Date.now() - t0 < timeout) {
    const p = await pos()
    if (last && Math.abs(p.x - last.x) < 0.01 && Math.abs(p.y - last.y) < 0.01 && !p.moving) {
      if (++still >= 4) return p
    } else still = 0
    last = p
    await sleep(250)
  }
  return pos()
}

// The app places the creature once, when the habitat window first registers —
// before we move that window — so it starts off to the side. Let the app's own
// behaviour walk it home: with the habitat in front, visitOrRest parks it at
// the centre of the stage facing the user. That resting pose is the anchor,
// and it is where the app will put it again at the end of the take.
// Roll first: the creature is still walking itself in, and those opening
// seconds get trimmed — the clip starts once the app has it settled.
const rec = record(env, 110, raw)
await sleep(1200)
const t0 = Date.now()
const at = () => (Date.now() - t0) / 1000 + 1.2
const marks = {}

const anchor = await settleAtRest()            // 1. the app walks it home
console.log('anchor:', JSON.stringify(anchor), '| settled at', at().toFixed(1) + 's')
if (anchor.dir !== 'down') throw new Error(`anchor is facing ${anchor.dir}, expected down`)
marks.settled = at()
await sleep(2500)

await setMode('manual')                        // 2. leave, low and to the right
// drop below the nav rail before crossing the edge: the window draws the
// creature behind its own chrome, so crossing at icon height flicks it from
// behind the rail to in front of it
await walk('y', 690)
await sleep(400)
await walk('x', 800)
await sleep(600)
await walk('y', 508)                           // …up…
await sleep(500)
await walk('x', 928)                           // …and out to the centre of the screen
await sleep(500)
// it arrives facing right; a short step down turns it to face the user, since
// direction only changes while walking
await walk('y', 524)
await sleep(1000)                              // 3. look at the user for a beat

// 4. the prompt, out on the desktop. Hatch draws the bubble on whichever
//    surface is showing the creature, so it comes from the roam overlay here.
await page.evaluate(() => window.hatch.debug({ cmd: 'triggerNotice', text: 'time to check in?' }))
// more than one overlay can be alive during a hand-over, and only the one
// actually holding the creature draws its bubble — so ask all of them
const findBubble = async (timeout) => {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    for (const w of app.windows()) {
      if (!w.url().includes('window=overlay')) continue
      const b = w.locator('.bubble')
      if ((await b.count()) && (await b.isVisible().catch(() => false))) return { page: w, node: b }
    }
    await sleep(150)
  }
  return null
}
const found = await findBubble(6000)
if (!found) {
  const overlays = app.windows().filter((w) => w.url().includes('window=overlay')).length
  throw new Error(`no speech bubble appeared (${overlays} overlay window(s) up)`)
}
const speech = found.node
console.log('bubble up on the desktop at', at().toFixed(1) + 's:',
  JSON.stringify(await speech.innerText()), '| facing', (await pos()).dir)
// let it run its course before setting off, so the bubble is not trailing
// along behind the creature on the way back
await speech.waitFor({ state: 'hidden', timeout: 12000 }).catch(() => {})
console.log('bubble gone at', at().toFixed(1) + 's')
await sleep(600)

await walk('y', 690)                           // 5. back the way it came, low
await sleep(300)
await walk('x', 380)
await sleep(700)

// 6. let the app walk it to the middle of the window and turn to face you —
//    only then open the check-in, so the panel never opens over a creature
//    still on its way in
await setMode('autonomous')
const back = await settleAtRest(20000)
console.log('back on its mark at', at().toFixed(1) + 's | drift',
  (back.x - anchor.x).toFixed(2), (back.y - anchor.y).toFixed(2))
await sleep(1200)
await page.locator('.checkin-anchor').click()
console.log('opened the check-in at', at().toFixed(1) + 's')
await sleep(3200)
const onPanel = await app.evaluate(({ BrowserWindow }) =>
  BrowserWindow.getAllWindows().filter((w) => w.webContents.getURL().includes('window=overlay')).length)
console.log('overlays open during check-in:', onPanel, '(want 0 — one bunny, not two)')
marks.cutFrom = at()

// 8. the tour — everything between the two check-in holds is the trimmable
//    block. The nav rail is walked top to bottom, and the quick-add wheel
//    lives on the habitat tab, so that comes first.
const closeCheckin = page.getByRole('button', { name: 'Close check-in' })
await closeCheckin.click()
await sleep(1400)
const wheel = page.getByRole('button', { name: 'Quick add' })
await wheel.click()                            // the ⊕ fans open
await sleep(2800)
await wheel.click()                            // …and closes again
await sleep(1000)
for (const panel of ['customise', 'playground', 'meadow', 'analytics', 'settings']) {
  await tab(panel)
  await sleep(2300)
}
await tab('habitat')
await sleep(900)
await page.locator('.checkin-anchor').click()                             // reopen, as it was
await sleep(1800)
marks.cutTo = at()

await sleep(2800)
await closeCheckin.click()                     // 9. back to the scene
await sleep(1400)
await tab('habitat')
await settleAtRest(8000)

// The app parks within one 2.6px step of its rest point, and it approached
// from a different side this time, so it can land one step off. Nudge it back
// onto the opening pixel — last step downwards, so it still faces the user.
let finish = await pos()
if (Math.abs(finish.x - anchor.x) > 0.05 || Math.abs(finish.y - anchor.y) > 0.05) {
  console.log('nudging back onto the mark from', (finish.x - anchor.x).toFixed(2), (finish.y - anchor.y).toFixed(2))
  await setMode('manual')
  await parkFacingDown(anchor.x, anchor.y)
  finish = await pos()
}
await sleep(4000)
marks.end = at()

console.log('final:', JSON.stringify(finish), '| drift:',
  (finish.x - anchor.x).toFixed(3), (finish.y - anchor.y).toFixed(3), '| facing', finish.dir)
if (Math.abs(finish.x - anchor.x) > 0.05 || Math.abs(finish.y - anchor.y) > 0.05 || finish.dir !== 'down') {
  console.warn('! the loop will jump — the creature did not finish on its mark')
}
await send({})
await sleep(1200)

await stopRecording(rec)
await app.close().catch(() => {})
scene.kill()

// ---- choose the loop, then encode both versions ----------------------------
const near = (t, spread = 0.8, step = 0.2) => {
  const out = []
  for (let v = t - spread; v <= t + spread + 1e-9; v += step) out.push(Number(v.toFixed(2)))
  return out
}
// the clip opens once the app has settled the creature, so the walk-in is
// trimmed; both ends are then the same resting pose
const loop = await findLoop(raw, near(marks.settled + 1.2, 0.8), near(marks.end - 1.5, 1.2), work, env)
console.log(`loop: ${loop.s}s → ${loop.e}s (frame difference ${loop.d.toFixed(3)})`)
const cut = await findLoop(raw, near(marks.cutFrom, 0.8), near(marks.cutTo, 0.8), work, env)
console.log(`ui tour cut: ${cut.s}s → ${cut.e}s (frame difference ${cut.d.toFixed(3)})`)

if (process.env.PREVIEW) {
  // fast single pass, no webm and no second variant — just something to watch
  await run(FFMPEG, ['-v', 'error', '-ss', String(loop.s), '-t', String((loop.e - loop.s).toFixed(2)),
    '-i', raw, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', `${OUT}/preview.mp4`, '-y'], env)
  console.log(`preview: ${OUT}/preview.mp4 · raw kept at ${raw}`)
  console.log(`marks: settled ${marks.settled.toFixed(1)}s · cut ${marks.cutFrom.toFixed(1)}–${marks.cutTo.toFixed(1)}s · end ${marks.end.toFixed(1)}s`)
  process.exit(0)
}

await encode(raw, {
  start: loop.s, duration: Number((loop.e - loop.s).toFixed(2)),
  out: `${OUT}/hatch-checkin-ui`, env,
})
await encodeSkipping(raw, {
  start: loop.s, cutFrom: cut.s, cutTo: cut.e, end: loop.e,
  out: `${OUT}/hatch-checkin`, poster: (loop.s + cut.s) / 2, env, work,
})
console.log('wrote hatch-checkin(.mp4/.webm/-poster.jpg) and hatch-checkin-ui to', OUT)

rmSync(profile, { recursive: true, force: true })
rmSync(work, { recursive: true, force: true })
