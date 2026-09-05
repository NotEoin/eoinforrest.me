# Shelved demos

The five interactive demos that used to sit between `before` and `after` on each
project page, plus the two components that existed only to serve them. Nothing
here is compiled: `tsconfig.app.json` includes `src` only, and eslint ignores
this directory.

| File | Was used by |
|---|---|
| `LidarDemo.tsx` | `/projects/lidar` — A* over a grid, clearance slider |
| `SnifferDemo.tsx` | `/projects/probe-sniffer` — clustering vs raw counts |
| `HalVoiceDemo.tsx` | `/projects/hal-voice` — streamed vs naive TTS pipeline |
| `HalRagDemo.tsx` | `/projects/hal` — retrieval ranking, skip-stubs toggle |
| `HatchDemo.tsx` | `/projects/hatch` — desktop presence, sprite walk cycle |
| `DemoFrame.tsx` | the shell all five sat in, plus `Slider`, `Toggle`, `useInView`, `usePrefersReducedMotion` |
| `LazyMount.tsx` | deferred mounting until within 200px of the viewport |

## Restoring one

1. Move the demo and `DemoFrame.tsx` / `LazyMount.tsx` back under `src/`.
2. Re-add `DemoKey` and the optional `demo` field to `Project` in
   `src/data/projects.ts`, and set `demo:` on the projects you want.
3. Re-add the `DEMOS` lazy map and the demo `<section>` to
   `src/pages/ProjectPage.tsx` — see the commit that shelved these.

The site copy no longer advertises demos; `index.html`, `src/lib/routeMeta.ts`
and `IntroSection.tsx` would need their descriptions putting back too.

Note `src/components/LensPlate.tsx` is **not** here. It is the act-04 plate on
the home page — a self-contained canvas port of the hal-voice `ui_eye.py`, not
one of the interactive demos, and it still renders.
