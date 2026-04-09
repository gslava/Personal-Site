# Personal Site

Static-first personal website built with `Angular 21` and `TypeScript`, designed for deployment to both `Cloudflare Pages` and `GitHub Pages`.

The site is now a localized single-page experience with:

- a full-screen particle hero
- a centered glass index card that links to on-page sections
- markdown-driven content loaded from one file per locale
- localized static output for `en`, `de`, and `uk`

## Highlights

- `Angular 21` with standalone components
- `TypeScript` with strict setup
- build-time localization for `en`, `de`, `uk`
- custom `Three.js` particle sphere on the hero section
- single-page markdown content model
- sticky header with centered fox mark and locale switcher
- static hosting support for `Cloudflare Pages` and `GitHub Pages`
- automated content and locale bootstrap checks before start, test, and build

## Current Site Structure

The page is rendered as one continuous document with these sections:

- `About Me`
- `Work Experience`
- `Education`
- `Technologies`
- `Projects`
- `Contact`

The hero index is generated from section `H1` headings in markdown and links to the corresponding anchors on the page.

## Tech Stack

- `Angular 21`
- `TypeScript`
- `Angular Router`
- `Angular i18n`
- `SCSS`
- `Three.js`
- `marked`
- `Vitest`
- `ESLint`
- `Prettier`

## Localization

Supported locales:

- `en` (source locale)
- `de`
- `uk`

Localized static builds are generated with these paths:

- `/` for English
- `/de/` for German
- `/uk/` for Ukrainian

The selected language is preserved for repeat visits through locale persistence logic.

## Content Model

Each locale uses one markdown file:

```text
src/assets/content/{locale}/all-in-one-page.md
```

Examples:

- `src/assets/content/en/all-in-one-page.md`
- `src/assets/content/de/all-in-one-page.md`
- `src/assets/content/uk/all-in-one-page.md`

Rules:

- each top-level section starts with `# H1`
- `---` starts a new page section
- `~~` renders as a small inline divider inside a section

Section registration lives in:

- `src/app/core/content/content-registry.json`

## Project Structure

```text
src/
  app/
    core/                # app shell, locale logic, content services
    features/
      home/              # home page and particle sphere
    shared/              # shared UI pieces
  assets/
    content/             # localized single-page markdown content
    i18n/                # translation files
public/                  # static public assets
scripts/                 # build, preview, validation helpers
```

## Local Development

### Runtime Requirement

Use `Node 22` or `Node 24`.

The repository includes:

- `.nvmrc`
- `.node-version`

If your machine is on `Node 25`, Angular may fail during build or preview.

### Install

```bash
npm install
```

### Recommended Local Preview

```bash
npm run start
```

This is the recommended way to inspect the site locally because it:

- builds the localized static output
- keeps it in watch mode
- serves the generated site through a local static server
- matches the real deployment model much better than `ng serve`

Default local URL:

- [http://localhost:4200](http://localhost:4200)

### Angular Dev Server

```bash
npm run start:dev
```

or

```bash
npm run dev:app
```

Use this only for fast component-level development. It is not the authoritative runtime for localized behavior.

## Available Scripts

```bash
npm run start
npm run start:dev
npm run build
npm run build:cloudflare
npm run build:github
npm run build:dev
npm run lint
npm run test
npm run format
npm run extract-i18n
```

Additional validation helpers:

```bash
npm run check:repo-hygiene
npm run check:content
npm run sync:locale-bootstrap
```

## Build Output

Production builds are generated into:

```text
dist/personal-site/browser
```

## Deployment

### Cloudflare Pages

Use:

- Build command: `npm run build`
- Output directory: `dist/personal-site/browser`

### GitHub Pages

Use:

```bash
GITHUB_PAGES_BASE_HREF=/your-repo-name/ npm run build:github
```

Example:

```bash
GITHUB_PAGES_BASE_HREF=/personal-site/ npm run build:github
```

The site is built as localized static output and is designed to work on static hosting.

## Hero Section

The hero contains:

- a full-bleed particle scene
- a centered translucent index card
- section links that scroll to anchors below

The heavy visual logic is lazy-loaded so the rest of the page stays lightweight.

## Quality Gates

Before start, test, and build, the project runs checks for:

- repository hygiene
- single-page markdown structure
- locale bootstrap generation

This reduces drift between localized builds, static preview, and deployment output.

## Notes

- `npm run start` is the best way to validate locale behavior.
- Content editing is intentionally separated from Angular view code.
- The current single-page structure is enforced by `scripts/check-content-files.mjs`.

## License

This repository is personal project code unless a different license is added later.
