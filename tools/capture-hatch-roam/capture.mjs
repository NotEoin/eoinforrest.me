// Records the act 02 plate from the real Hatch app on an isolated X display.
// See README.md in this folder for what it does and why.
//
//   Xvfb :99 -screen 0 1920x1080x24 +extension Composite +extension RENDER &
//   HATCH_DIR=../hatch OUT_DIR=public/media/hatch node tools/capture-hatch-roam/capture.mjs
import { _electron } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const HATCH = resolve(process.env.HATCH_DIR ?? '../hatch')
const OUT = resolve(process.env.OUT_DIR ?? 'public/media/hatch')
const ELECTRON = `${HATCH}/node_modules/electron/dist/electron`
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg'
const FFPROBE = process.env.FFPROBE ?? 'ffprobe'
const DISPLAY = process.env.CAPTURE_DISPLAY ?? ':99'

const profile = mkdtempSync(`${tmpdir()}/hatch-capture-`)
const work = mkdtempSync(`${tmpdir()}/hatch-frames-`)
mkdirSync(OUT, { recursive: true })

const env = { ...process.env, DISPLAY, XDG_SESSION_TYPE: 'x11', XDG_CONFIG_HOME: `${profile}/.config` }
delete env.WAYLAND_DISPLAY
delete env.ELECTRON_RUN_AS_NODE
delete env.ELECTRON_OZONE_PLATFORM_HINT

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const launch = () => _electron.launch({ executablePath: ELECTRON, args: ['--no-sandbox', '.'], cwd: HATCH, env })
const run = (cmd, args) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, args, { env, stdio: ['ignore', 'pipe', 'inherit'] })
    let out = ''
    p.stdout.on('data', (d) => (out += d))
    p.on('exit', (code) => (code === 0 ? res(out.trim()) : rej(new Error(`${cmd} exited ${code}`))))
  })

// ---- phase A: onboard and set the creature up, then quit -------------------
{
  const app = await launch()
  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await sleep(2500)
  await page.evaluate(async () => {
    const h = window.hatch
    await h.completeOnboarding().catch(() => {})
    await h.debug({ cmd: 'setStage', stage: 'mature' })
    await h.debug({ cmd: 'setWellbeing', mood: 88, energy: 80, health: 85, social: 75 })
    await h.setSettings({ aiIdleMinutes: 0, liveliness: 1, creatureScale: 2.5 })
  })
  await sleep(1000)
  await app.close().catch(() => {})
  await sleep(1500)
}

// ---- the staged desktop ----------------------------------------------------
const scene = spawn(ELECTRON, ['--no-sandbox', HERE], { env, stdio: 'ignore' })
await sleep(3500)

// ---- the app ---------------------------------------------------------------
const app = await launch()
const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')
await sleep(3000)

await app.evaluate(({ BrowserWindow }) => {
  const w = BrowserWindow.getAllWindows()[0]
  w.setBounds({ x: 55, y: 205, width: 590, height: 700 })
  // no window manager here, so setBounds emits no 'move' — deliver it, or the
  // presence system keeps stale bounds and never spawns a roam overlay
  w.emit('move'); w.emit('moved'); w.emit('resize')
})
await page.evaluate(() => window.hatch.setSettings({ creatureScale: 2.5, aiIdleMinutes: 0, liveliness: 1 }))
await sleep(2500)

const NONE = { up: false, down: false, left: false, right: false }
const send = (d) => page.evaluate((i) => window.hatch.sendInput(i), { ...NONE, ...d })
const pos = () => page.evaluate(() => window.hatch.getPresence())
await page.evaluate(() => window.hatch.setControlMode('manual'))

async function steerTo(tx, ty, ms = 26000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const p = await pos()
    const dx = tx - (p.x + 32), dy = ty - (p.y + 32)
    if (Math.hypot(dx, dy) < 30) break
    await send({ left: dx < -16, right: dx > 16, up: dy < -16, down: dy > 16 })
    await sleep(150)
  }
  await send({})
}

await steerTo(330, 620)      // start at home, inside its own window
await sleep(1200)

const raw = `${work}/raw.mp4`
const rec = spawn(FFMPEG, [
  '-y', '-f', 'x11grab', '-draw_mouse', '0', '-framerate', '30',
  '-video_size', '1920x1080', '-i', DISPLAY,
  '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-t', '60', raw,
], { env, stdio: 'ignore' })

await sleep(3000)            // beat 1 — at home
await steerTo(560, 660)      // beat 2 — to the window's edge
await sleep(700)
await steerTo(760, 690)      //         …and out onto the bare desktop
await sleep(1700)
await steerTo(1020, 760)     // beat 3 — across the reader window
await sleep(1600)
await steerTo(1150, 330)     // beat 4 — up onto the notes window
await sleep(2000)
await steerTo(820, 420)      // beat 5 — back down
await steerTo(620, 620)      //         …and home again
await sleep(1500)

await page.evaluate(() => window.hatch.setControlMode('autonomous'))
await sleep(2500)
await new Promise((r) => { rec.on('exit', r); rec.kill('SIGINT'); setTimeout(r, 8000) })
await app.close().catch(() => {})
scene.kill()

// ---- pick the tightest loop, then encode -----------------------------------
// Compare candidate first/last frames and keep the closest pair, so the plate
// loops without the creature jumping across the screen.
const frame = async (t, name) => {
  await run(FFMPEG, ['-v', 'error', '-ss', String(t), '-i', raw, '-frames:v', '1', `${work}/${name}.png`, '-y'])
  return `${work}/${name}.png`
}
const meanDiff = async (a, b) => {
  const out = await run(FFMPEG, ['-v', 'error', '-i', a, '-i', b, '-filter_complex',
    'blend=all_mode=difference,signalstats,metadata=print:file=-', '-f', 'null', '-'])
  const vals = [...out.matchAll(/lavfi\.signalstats\.[YUV]AVG=([\d.]+)/g)].map((m) => Number(m[1]))
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : Infinity
}
let best = null
for (const s of [5, 5.5, 6, 6.5]) {
  for (const e of [29, 29.5, 30, 30.5, 31]) {
    const d = await meanDiff(await frame(s, `s${s}`), await frame(e, `e${e}`))
    if (!best || d < best.d) best = { d, s, e }
  }
}
console.log(`loop: ${best.s}s → ${best.e}s (frame difference ${best.d.toFixed(2)})`)
const dur = (best.e - best.s).toFixed(2)

await run(FFMPEG, ['-v', 'error', '-ss', String(best.s), '-t', dur, '-i', raw, '-an',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', `${OUT}/hatch-roam.mp4`, '-y'])
await run(FFMPEG, ['-v', 'error', '-ss', String(best.s), '-t', dur, '-i', raw, '-an',
  '-c:v', 'libvpx-vp9', '-crf', '42', '-b:v', '0', '-row-mt', '1', '-deadline', 'good',
  `${OUT}/hatch-roam.webm`, '-y'])
await run(FFMPEG, ['-v', 'error', '-ss', String(best.s + 6), '-i', raw, '-frames:v', '1', '-q:v', '3',
  `${OUT}/hatch-roam-poster.jpg`, '-y'])

console.log('wrote hatch-roam.mp4 / .webm / -poster.jpg to', OUT,
  '·', await run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${OUT}/hatch-roam.mp4`]), 'seconds')

rmSync(profile, { recursive: true, force: true })
rmSync(work, { recursive: true, force: true })
