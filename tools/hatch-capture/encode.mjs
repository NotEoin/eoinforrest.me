// Encode the shipping clips from a take that is already recorded, so trying a
// different trim never costs another capture. The capture scripts print the
// numbers this wants.
//
//   RAW=/tmp/hatch-frames-XXXX/raw.mp4 LOOP_S=9.85 LOOP_E=86.49 \
//   CUT_S=49.59 CUT_E=78.68 NAME=hatch-checkin OUT_DIR=public/media/hatch \
//   node tools/hatch-capture/encode.mjs
import { OUT, makeEnv, freshProfile, workDir, encode, encodeSkipping, rmSync } from './lib.mjs'

const raw = process.env.RAW
if (!raw) throw new Error('set RAW to the recorded take')
const name = process.env.NAME ?? 'hatch-checkin'
const num = (k, fallback) => (process.env[k] === undefined ? fallback : Number(process.env[k]))
const loopS = num('LOOP_S')
const loopE = num('LOOP_E')
const cutS = num('CUT_S')
const cutE = num('CUT_E')
if ([loopS, loopE].some((v) => v === undefined || Number.isNaN(v))) {
  throw new Error('set LOOP_S and LOOP_E')
}

const env = makeEnv(freshProfile())
const work = workDir()
const hasTour = !Number.isNaN(cutS) && cutS !== undefined && !Number.isNaN(cutE) && cutE !== undefined

// the full take, tour included
await encode(raw, {
  start: loopS,
  duration: Number((loopE - loopS).toFixed(2)),
  out: `${OUT}/${name}-ui`,
  env,
})
console.log(`${name}-ui: ${(loopE - loopS).toFixed(1)}s`)

if (hasTour) {
  // and the same take with the panel tour lifted out — both cut points sit on
  // held frames that match, so the join does not show
  await encodeSkipping(raw, {
    start: loopS, cutFrom: cutS, cutTo: cutE, end: loopE,
    out: `${OUT}/${name}`, poster: (loopS + cutS) / 2, env, work,
  })
  console.log(`${name}: ${((loopE - loopS) - (cutE - cutS)).toFixed(1)}s (tour removed)`)
}

rmSync(work, { recursive: true, force: true })
