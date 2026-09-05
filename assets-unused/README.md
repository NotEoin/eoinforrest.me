# Held-aside media

Clips that aren't referenced by the site but are worth keeping to hand. They
were shipping in `public/` and being deployed, which cost ~2.5 MB of upload for
files no page ever requested.

| File | What it is |
|---|---|
| `hatch/hatch-checkin-ui.{mp4,webm}` | The check-in take with the panel tour left in |
| `hatch/hatch-roam.{mp4,webm}` + poster | The earlier wander-only clip |
| `hal-voice/eye.gif` | The lens animation, as used in the hal-voice README |

To swap one back into the Hatch act, move the pair into
`public/media/hatch/` and point the `plate` in `src/data/projects.ts` at it —
see the comment on the Hatch entry.
