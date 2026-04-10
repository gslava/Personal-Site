# Project Overview

This repository contains a static-first personal website built with:

- `Angular 21`
- `TypeScript`
- `Angular i18n`
- `Three.js`
- `marked`
- deployment targets:
  - `Cloudflare Pages`
  - `GitHub Pages`

The current site is a localized single-page website. It has:

- a sticky top header
- a centered fox icon in the header that scrolls to the top
- a language switcher on the right side of the header
- a full-screen Home hero with a reference-driven particle sphere
- a centered section index over the particle sphere
- markdown-driven content sections below the hero
- localized content for:
  - `en`
  - `de`
  - `uk`

# Current Site Structure

The page is built from one markdown file per locale:

- `src/assets/content/en/all-in-one-page.md`
- `src/assets/content/de/all-in-one-page.md`
- `src/assets/content/uk/all-in-one-page.md`

The markdown contract is:

- each major page section starts with `# H1`
- `---` starts a new major card/section
- `~~` renders as an inline divider inside the current card

The current major sections are:

1. `About Me`
2. `Work Experience`
3. `Education`
4. `Technologies`
5. `Projects`
6. `Contact`

The canonical section registry is:

- `src/app/core/content/content-registry.json`

# Important Project Files

Read these files first when you need project context:

- `README.md` for public-facing project documentation
- `PLANS.MD` for the current actionable implementation plan
- `src/app/app.routes.ts` for the current Angular route model
- `src/app/core/layout/site-shell/` for the header and layout shell
- `src/app/features/home/pages/home-page/` for hero, index, sections, and responsive layout
- `src/app/features/home/components/particle-sphere/` for the Three.js particle effect
- `src/app/core/content/` for markdown parsing and content loading
- `scripts/check-content-files.mjs` for the content contract validator
- `scripts/start-localized-preview.mjs` for the local preview runtime

# Running The Project

Use `Node 22` or `Node 24`.

Install dependencies:

```bash
npm install
```

Recommended local preview:

```bash
npm run start
```

This runs the localized static preview and is the correct way to test language behavior.

Open:

```text
http://localhost:4200/
```

For fast Angular dev mode only:

```bash
npm run start:dev
```

Do not use `ng serve` as the authoritative check for localized behavior. The production-like runtime is the localized static preview from `npm run start`.

# Validation Commands

Before considering a change complete, prefer running the relevant checks:

```bash
npm run check:content
npm run lint
npm run test -- --watch=false --progress=false
npm run build -- --localize --progress=false
```

If using the direct Angular CLI with the local Node helper, this project has often been checked with:

```bash
npx --yes node@22 ./node_modules/@angular/cli/bin/ng build --localize --progress=false
```

# Deployment Notes

Cloudflare Pages:

- build command: `npm run build`
- output directory: `dist/personal-site/browser`

GitHub Pages:

```bash
GITHUB_PAGES_BASE_HREF=/your-repo-name/ npm run build:github
```

# Working Rules

1. If there are questions, ask them before writing code or creating a plan.

2. The current actionable implementation plan always lives in:

   `PLANS.MD`

3. When a new plan is created, the previous contents of `PLANS.MD` must be fully replaced.

4. Preserve the existing Angular app structure unless the current plan explicitly requires broader changes.

5. The project may contain local generated files such as `.DS_Store`; ignore them when they are already covered by `.gitignore`.

6. For user-visible visual changes, verify with a browser or screenshot whenever practical.

# Current Visual Notes

- Desktop/non-mobile index buttons float over the particle sphere without a visible index card panel.
- Mobile index buttons have only a minimal blur on the buttons themselves.
- The broad mobile hero blur layer has been removed.
- The header is highly transparent with a `backdrop-filter` blur.
