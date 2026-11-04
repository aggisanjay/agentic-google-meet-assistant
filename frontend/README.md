# Agentic Meet: cinematic landing page

Drop-in replacement for the landing page of `agentic-google-meet-assistant/frontend` (Next.js 16, React 19, Tailwind v4, TypeScript).

## Install

1. Copy these over your `frontend/` (merge): `src/`, `public/`, `scripts/`, `postcss.config.mjs`, `package.json`.
   *Don't keep your old `postcss.config.mjs`. It contains hidden malicious code (see SECURITY-NOTICE.md); the one here is clean.*
2. `npm install` then `npm run dev`.
3. Your dashboard, sign-in, Descope auth, API calls and routes are untouched.

## What's on the page, and why

Every visual comes from what the product actually does. Nothing is decoration.

| Section | What it shows | How it's built |
|---|---|---|
| **Hero** | A week of Google Calendar as obsidian-glass tiles. A meeting proposal runs the agent's real flow: free/busy scan → conflict with *Sprint planning* → resolves to a free gap → confirmation → Meet link, synced to a live trace bar | Real-time Three.js (react-three-fiber). Procedural geometry, canvas-baked labels, reflective floor, pointer parallax + scroll dolly. Poster image first; WebGL fades in over it |
| **Pipeline** | Scroll-pinned walk through the 5 stages of a request (Descope → Mastra/Gemini → validated tools → Google Calendar → SSE), with an inspector for each | Motion `useScroll`, CSS crossfades |
| **Live demo** | Your chat panel's real event model: stream, confirmation card with working **Confirm / Cancel**, provenance pills. Three scenarios: book, resolve a conflict, resist a prompt injection | Scripted simulation, clearly labelled "sample data" |
| **Safety** | The three guarantees + your eval-suite numbers (15/15, 0% injection bypass, 0% unauthorized writes, 100% conflict detection, **87.5% tool-selection, shown honestly**) | Count-ups |
| **Timezone globe** | Real Natural Earth land, **day/night terminator from the actual current UTC time**, live city clocks, and "tomorrow 10:00 in Tokyo → your time" computed with `Intl` (so DST is real) | Three.js points + custom shaders; land baked to a 34 KB binary |
| **FAQ / CTA / footer** | Claims taken from your README, nothing invented | |

## Performance & accessibility
- `three` + r3f load lazily; the hero paints from `public/hero-poster.webp` (51 KB) first.
- Reduced-motion, Save-Data, ≤1 GB devices and no-WebGL get the poster / list-only globe. Tested.
- Rendering pauses when a canvas is off-screen. Fonts are self-hosted (`@fontsource`), so no Google Fonts request at build or runtime.
- Keyboard-operable tabs, accordion, and dialogs-free design; visible focus rings; `aria-live` on the demo and trace.

## Things to know
- **Copy claims** come from your README/code. The telemetry in the demo is labelled sample data. Edit text directly in the components under `src/components/landing/`.
- `src/types/lucide-react.d.ts` (your hand-written icon shim) was extended with the icons used here.
- `layout.tsx` now loads Geist via `@fontsource-variable` instead of `next/font/google` (so builds work offline). This also restyles the dashboard font; revert if you prefer Plus Jakarta there.
- `?ht=7.6` on the URL freezes the hero choreography at a moment (used to bake the poster). Harmless; remove from `hero.tsx` if you like.
- Re-bake the globe's land points with `node scripts/make-land-points.mjs`; re-bake the hero poster by screenshotting the hero canvas at `?ht=7.6`.
- The 3D is procedural: no third-party models, so there's no licence to attribute. Map data: Natural Earth (public domain).
