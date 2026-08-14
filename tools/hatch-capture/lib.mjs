// Shared harness for the Hatch captures: launches the real app on an isolated
// X display, drives it through its own IPC, records, and encodes.
//
// Two notes on the harness (neither changes app behaviour):
//  - There is no window manager on the capture display, so a programmatic
//    setBounds() never emits 'move'. The app refreshes its bounds registry on
//    that event, so we deliver it ourselves — otherwise the presence system
//    keeps stale bounds and never spawns a roam overlay.
//  - Steering uses the app's own manual control, the same path WASD uses.
//    Every move is single-axis: the creature walks on a fixed 2.6px cardinal
//    lattice (WALK_SPEED in the app's movement.ts), so avoiding diagonals is
//    what lets it return to its starting pixel exactly, and the video loop
//    close without a jump.
import { _electron } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HERE = dirname(fileURLToPath(import.meta.url))
export const HATCH = resolve(process.env.HATCH_DIR ?? '../hatch')
export const OUT = resolve(process.env.OUT_DIR ?? 'public/media/hatch')
export const ELECTRON = `${HATCH}/node_modules/electron/dist/electron`
export const FFMPEG = process.env.FFMPEG ?? 'ffmpeg'
export const DISPLAY = process.env.CAPTURE_DISPLAY ?? ':99'
export const STEP = 2.6 // WALK_SPEED, px per tick

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function makeEnv(profile) {
  const env = { ...process.env, DISPLAY, XDG_SESSION_TYPE: 'x11', XDG_CONFIG_HOME: `${profile}/.config` }
  delete env.WAYLAND_DISPLAY
  delete env.ELECTRON_RUN_AS_NODE
  delete env.ELECTRON_OZONE_PLATFORM_HINT
  return env
}

// Scratch goes on disk, never in /tmp: on this box (and most Ubuntu installs)
// /tmp is tmpfs, so a 90-second capture plus the frames the loop scan pulls
// out of it would be held in RAM — enough to get the whole run OOM-killed.
const SCRATCH = process.env.CAPTURE_SCRATCH ?? `${homedir()}/.cache/hatch-capture`
mkdirSync(SCRATCH, { recursive: true })

export function freshProfile() {
  const p = mkdtempSync(`${SCRATCH}/profile-`)
  mkdirSync(`${p}/.config`, { recursive: true })
  return p
}

export const workDir = () => mkdtempSync(`${SCRATCH}/take-`)

mkdirSync(OUT, { recursive: true })

export const launchApp = (env) =>
  _electron.launch({ executablePath: ELECTRON, args: ['--no-sandbox', '.'], cwd: HATCH, env })

export const startScene = (env) => spawn(ELECTRON, ['--no-sandbox', HERE], { env, stdio: 'ignore' })

export function run(cmd, args, env) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { env, stdio: ['ignore', 'pipe', 'inherit'] })
    let out = ''
    p.stdout.on('data', (d) => (out += d))
    p.on('exit', (code) => (code === 0 ? res(out.trim()) : rej(new Error(`${cmd} exited ${code}`))))
  })
}

/** Place the habitat window and tell the app about it (see the note above). */
export async function placeHabitat(app, bounds) {
  return app.evaluate(({ BrowserWindow }, b) => {
    const w = BrowserWindow.getAllWindows()[0]
    w.setBounds(b)
    w.emit('move'); w.emit('moved'); w.emit('resize')
    w.focus(); w.emit('focus')
    return w.getBounds()
  }, bounds)
}

/** Manual-control steering, single-axis only so the lattice is preserved. */
export function driver(page) {
  const NONE = { up: false, down: false, left: false, right: false }
  const send = (d) => page.evaluate((i) => window.hatch.sendInput(i), { ...NONE, ...d })
  const pos = () => page.evaluate(() => window.hatch.getPresence())

  const axisOf = (axis, sign) =>
    axis === 'x' ? (sign > 0 ? { right: true } : { left: true }) : sign > 0 ? { down: true } : { up: true }

  /** Walk one axis to `target`, coarse then pulsed. `exact` converges to the
   *  lattice point itself (the residual is always a multiple of 2.6px). */
  async function walk(axis, target, { exact = false, timeout = 30000 } = {}) {
    const t0 = Date.now()
    const read = async () => (await pos())[axis]
    while (Date.now() - t0 < timeout) {
      const d = target - (await read())
      if (Math.abs(d) <= (exact ? STEP * 1.4 : 6)) break
      await send(axisOf(axis, Math.sign(d)))
      await sleep(90)
    }
    await send({})
    if (!exact) return
    for (let i = 0; i < 40; i++) {
      const d = target - (await read())
      if (Math.abs(d) < 0.05) break
      await send(axisOf(axis, Math.sign(d)))
      await sleep(45)
      await send({})
      await sleep(60)
    }
    await send({})
  }

  /** Land exactly on (x, y) with the last step walking DOWN, so the creature
   *  finishes facing the user — dir only changes while moving. */
  async function parkFacingDown(x, y) {
    const at = await pos()
    // already standing on the mark, facing the user — don't shuffle for nothing
    if (Math.abs(at.x - x) < 0.05 && Math.abs(at.y - y) < 0.05 && at.dir === 'down') return at
    await walk('x', x, { exact: true })
    const above = y - STEP * 4
    if ((await pos()).y > above) await walk('y', above)
    await walk('y', y, { exact: true })
    const p = await pos()
    if (p.dir !== 'down') {
      // a correction step ended facing the wrong way — back off and re-approach
      await walk('y', y - STEP * 3)
      await walk('y', y, { exact: true })
    }
    return pos()
  }

  return { send, pos, walk, parkFacingDown }
}

export function record(env, seconds, file) {
  return spawn(FFMPEG, [
    '-y', '-f', 'x11grab', '-draw_mouse', '0', '-framerate', '30',
    '-video_size', '1920x1080', '-i', DISPLAY,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-t', String(seconds), file,
  ], { env, stdio: 'ignore' })
}

export const stopRecording = (rec) =>
  new Promise((r) => { rec.on('exit', r); rec.kill('SIGINT'); setTimeout(r, 8000) })

/** Mean per-channel difference between two frames of the recording. */
export async function frameDiff(raw, a, b, work, env) {
  const grab = async (t, name) => {
    const f = `${work}/${name}.png`
    // downscaled: the metric is a mean over the frame, so full resolution buys
    // nothing and costs hundreds of megabytes across a scan
    await run(FFMPEG, ['-v', 'error', '-ss', String(t), '-i', raw, '-frames:v', '1',
      '-vf', 'scale=480:-1', f, '-y'], env)
    return f
  }
  const out = await run(FFMPEG, ['-v', 'error', '-i', await grab(a, 'cmp-a'), '-i', await grab(b, 'cmp-b'),
    '-filter_complex', 'blend=all_mode=difference,signalstats,metadata=print:file=-',
    '-f', 'null', '-'], env)
  const vals = [...out.matchAll(/lavfi\.signalstats\.[YUV]AVG=([\d.]+)/g)].map((m) => Number(m[1]))
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : Infinity
}

/** Search a window of candidate in/out points for the closest-matching pair. */
export async function findLoop(raw, starts, ends, work, env) {
  let best = null
  for (const s of starts) {
    for (const e of ends) {
      const d = await frameDiff(raw, s, e, work, env)
      if (!best || d < best.d) best = { d, s, e }
    }
  }
  return best
}

export async function encode(raw, { start, duration, out, poster, env }) {
  await run(FFMPEG, ['-v', 'error', '-ss', String(start), '-t', String(duration), '-i', raw, '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', `${out}.mp4`, '-y'], env)
  await run(FFMPEG, ['-v', 'error', '-ss', String(start), '-t', String(duration), '-i', raw, '-an',
    '-c:v', 'libvpx-vp9', '-crf', '42', '-b:v', '0', '-row-mt', '1', '-deadline', 'good',
    '-threads', '4', '-tile-columns', '1',
    `${out}.webm`, '-y'], env)
  if (poster !== undefined) {
    await run(FFMPEG, ['-v', 'error', '-ss', String(poster), '-i', raw, '-frames:v', '1', '-q:v', '3',
      `${out}-poster.jpg`, '-y'], env)
  }
}

/** Encode two ranges of the same take as one continuous clip. Used to drop the
 *  UI tour: both cut points sit on identical held frames, so it is seamless. */
export async function encodeSkipping(raw, { start, cutFrom, cutTo, end, out, poster, env, work }) {
  const parts = []
  const seg = async (i, from, to) => {
    const f = `${work}/seg${i}.mp4`
    await run(FFMPEG, ['-v', 'error', '-ss', String(from), '-t', String((to - from).toFixed(3)), '-i', raw,
      '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', f, '-y'], env)
    parts.push(f)
  }
  await seg(0, start, cutFrom)
  await seg(1, cutTo, end)
  const list = `${work}/parts.txt`
  await run('bash', ['-c', `printf "file '%s'\\n" ${parts.join(' ')} > ${list}`], env)
  const joined = `${work}/joined.mp4`
  await run(FFMPEG, ['-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', joined, '-y'], env)
  await encode(joined, { start: 0, duration: (cutFrom - start) + (end - cutTo), out, poster, env })
}

export { rmSync, resolve }
