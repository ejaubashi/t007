# Flyshare recreation

A responsive React + Three.js recreation of the Flyshare experience shown in the three supplied screen recordings.

## Run

Requires Node.js 20.19+ or 22.12+ (validated with Node 24).

```sh
npm ci
npm run dev
```

Production build: `npm run build`. Serve the build with `npm run preview`.

Use the existing checkout for development; no additional Git worktree is needed.

## Included

- Day/night home, persistent color preference, floating metallic logo and atmospheric background.
- Project gallery and an About section.
- FS-45 presentation with Ship, Build, Detail, Engines and Cockpit sections.
- Build-stage slider, detail dialogs and expanded cockpit view.
- Three.js spaceship/robot viewer: animated form switching, orbit, zoom, reset and fullscreen.
- Interactive planet scene and opt-in synthesized ambient sound.
- Mobile layouts, keyboard focus styles, native modal dialogs and reduced-motion support.

Routes: `/`, `/#work`, `/#about`, `/fs45/`, `/fs45/transform/`, `/universe/`.
Production hosting must rewrite these routes to `index.html` (SPA fallback).

## Validation

```sh
# If no system Chromium is available:
npx playwright install chromium
npm test
npm run build
```

Tests use `/usr/bin/chromium` when available, otherwise Playwright's Chromium. `CHROMIUM_PATH` can select another installed executable. The browser suite starts and stops its own Vite server at port 4174 and exercises the desktop and mobile flows, themes, WebGL initialization, dialogs, stage slider, navigation, viewer form switching and missing-resource/runtime-error checks.

## Fidelity and assets

The screenshots in `public/images` are clean crops from the user-supplied recordings, with browser chrome excluded. The logo, spacecraft, robot and planet are locally reconstructed procedural geometry, not the original site's 3D assets. The transformation is a stylized transition between these reconstructed forms. Ambient audio is synthesized locally; it is not the original soundtrack. The About copy, detail explanations and unrecorded planet interaction are representative additions. Day mode changes the presentation; the original site's professional-work collection was not available in the supplied recordings.

This is a frontend implementation. It has no accounts, backend or external API requirements. The development entry point is `src/index.html`. The root `index.html` and the `assets`, `images`, `fs45`, and `universe` directories are the compiled Pages site, also mirrored to `gh-pages`.

## GitHub Pages

`npm run build:pages` builds for the project URL `/t007/` and creates real HTML
entry points for each route so direct links and refreshes work on GitHub Pages.
This command also refreshes the compiled site at the repository root so Pages can serve `main` directly. The contents of `dist` can also be published at the root of the `gh-pages` branch. In repository
Settings → Pages, the publishing source must be **Deploy from a branch**,
branch **main** or **gh-pages**, folder **/ (root)**. Both branches include the compiled site.

Expected project URL, once Pages is enabled and deployment completes:
`https://ejaubashi.github.io/t007/`.
