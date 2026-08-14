# eoinforrest.me

My portfolio site — a virtual CV, a cinematic reel of five projects, and interactive demos you can
operate in the browser.

## What it is

- **`/`** — an introduction, five full-screen project acts, how the projects connect, the short CV and contact.
- **`/projects`** — a fast index of all nine projects.
- **`/projects/:slug`** — a deep dive per project, with its demo where a demo helps.
- **`/cv`** — the virtual CV, printable, with a matching PDF at `/Eoin-Forrest-CV.pdf`.

The five demos are faithful but scripted reconstructions: the Lidar A\* search and the sniffer's
fingerprint clustering are genuinely computed in the browser; the hal-voice timings and the RAG
answers are authored. Every demo says so in its caption.

## Stack

Vite · React 18 · TypeScript · Tailwind CSS · Framer Motion · React Router. No other runtime
dependencies. The act choreography uses CSS scroll-driven animations where supported, with a
Framer Motion fallback.

## Running it

```
npm install
npm run dev
```

`npm run build` produces `dist/`. Deep links need an SPA rewrite — `vercel.json` carries one.

## Notes

- Every asset that doesn't exist yet renders as a visible placeholder at its real path and aspect
  ratio, so swapping the file in needs no layout change.
- The act 02 plate is recorded from the real Hatch app — see
  [`tools/capture-hatch-roam`](tools/capture-hatch-roam/README.md) to shoot it again.
- All project data — repo URLs, tints, status, media paths — lives in `src/data/projects.ts`.
- The zero-shot CXR page is built but gated (`published: false`) until supervisor sign-off.
- The contact form posts to Formspree once a public form id is set in
  `src/components/ContactSection.tsx`; until then it falls back to composing an email.
- The CV page and the PDF are updated in the same commit, always.
