# Capturing `media/hatch/hatch-roam.mp4`

Records the act 02 plate from the **real Hatch app** — the creature walking out of its window and
across a staged desktop — on an isolated X display, so the shot is reproducible and nothing from a
real desktop ends up in the frame.

## What you need

- The `hatch` repo, built (`npm run build` in it, so `out/main/index.js` exists).
- `Xvfb`, `ffmpeg`, and `playwright` (only the Node package; it drives the app's own Electron binary).

## Run it

```bash
Xvfb :99 -screen 0 1920x1080x24 +extension Composite +extension RENDER -nolisten tcp &
HATCH_DIR=../hatch OUT_DIR=public/media/hatch node tools/capture-hatch-roam/capture.mjs
```

It writes `hatch-roam.mp4`, `hatch-roam.webm` and `hatch-roam-poster.jpg` into `OUT_DIR`, and prints
the two frame timestamps it picked for the loop.

## Two notes on the harness

Neither changes how the app behaves:

- **The `move` event is delivered by hand.** There is no window manager on the capture display, so a
  programmatic `setBounds()` never emits `move`. Hatch refreshes its bounds registry on that event,
  and without it the presence system keeps stale bounds, believes the creature is still inside the
  habitat, and never spawns a roam overlay — the creature simply goes invisible off-window.
- **Steering uses the app's own manual control** (`setControlMode('manual')` + `sendInput`), the same
  path the WASD keys use. The creature walks itself; nothing is faked in post.

The creature, its name, stage and mood come from the app's own debug commands, so each capture has a
freshly generated creature.
