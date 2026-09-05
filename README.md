# eoinforrest.me

My portfolio site — a virtual CV, a cinematic reel of five projects, and a write-up for each.

## What it is

- **`/`** — an introduction, five full-screen project acts, how the projects connect, the short CV and contact.
- **`/projects`** — a fast index of all seven projects.
- **`/projects/:slug`** — a deep dive per project, with its figures.
- **`/cv`** — the virtual CV, printable, with a matching PDF at `/Eoin-Forrest-CV.pdf`.

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
  [`tools/hatch-capture`](tools/hatch-capture/README.md) to shoot it again. `checkin.mjs` records
  the check-in demo, `roam.mjs` the earlier wander, and `encode.mjs` re-cuts a take without
  re-shooting it.
- All project data — repo URLs, tints, status, media paths — lives in `src/data/projects.ts`.
- The zero-shot CXR page is built but gated (`published: false`) until supervisor sign-off.
- The contact form posts to Formspree once a public form id is set in
  `src/components/ContactSection.tsx`; until then it falls back to composing an email.
- The CV lives in [`src/data/cv.json`](src/data/cv.json). The `/cv` page and
  `public/Eoin-Forrest-CV.pdf` both read it, so they cannot say different things. Edit the JSON,
  then run `python3 tools/build-cv-pdf.py` and commit both. The content is ASCII by rule and the
  PDF build fails on the first non-ASCII byte.
- Only the contact block differs between the two: the email is assembled in the browser so it
  stays out of the prerendered HTML, and the phone number is in the PDF alone.
