# hatch-capture

Records the Hatch plates by driving the real app on an isolated X display, so the footage is the
application behaving normally rather than a mock-up.

```bash
Xvfb :99 -screen 0 1920x1080x24 +extension Composite +extension RENDER &
HATCH_DIR=../portfolio-repos/hatch OUT_DIR=public/media/hatch node tools/hatch-capture/checkin.mjs
```

| file | what it does |
|---|---|
| `checkin.mjs` | the check-in demo: rests facing you, leaves the window, asks for a check-in from the desktop, returns and opens the panel. Writes `hatch-checkin` (short) and `hatch-checkin-ui` (with the panel tour) |
| `roam.mjs` | the earlier clip: the creature crossing onto the desktop over other windows |
| `encode.mjs` | re-cuts a take that is already recorded, so trying a different trim costs no capture |
| `scene.js` | the staged desktop — a wallpaper and two neutral windows, loaded by Electron as its own app |
| `lib.mjs` | shared harness: launch, steering, recording, loop-point search, encoding |

## Things worth knowing

- **The loop is exact.** The creature walks a fixed 2.6px cardinal lattice, so as long as no move is
  diagonal it can return to its opening pixel precisely; the clip is then cut at two frames that
  measure identical.
- **The panel tour is trimmable.** Both cut points sit on held, matching frames, so `hatch-checkin`
  is `hatch-checkin-ui` with the middle removed and no visible join.
- **Scratch goes on disk, never `/tmp`** — that is tmpfs here, and a 90-second capture plus the
  frames the loop search pulls from it is enough RAM to get the run OOM-killed. Override with
  `CAPTURE_SCRATCH`.
- **No window manager on the capture display**, so `setBounds()` emits no `move` event and Hatch
  would keep stale window bounds; the harness sends that event itself.
- The app needs `completeOnboarding()` on a first launch and then a relaunch, or it opens into the
  onboarding wizard.
