# Personal Site

Static-first personal website built with `Angular 21` and `TypeScript`, designed for deployment to both `Cloudflare Pages` and `GitHub Pages`.

The project combines a visual landing page with a custom `Three.js` particle sphere, localized routing, and markdown-driven content pages.

## Highlights

- `Angular 21` with standalone components
- `TypeScript` with strict project setup
- build-time localization for `en`, `de`, `uk`
- localized static output for `Cloudflare Pages` and `GitHub Pages`
- custom `Three.js` particle sphere on the home page
- markdown-powered content pages
- hash-based routing for reliable static hosting
- automated content and locale bootstrap checks before build/test/start

## Current Pages

- `Home`
- `Technologies`
- `Projects`
- `About Me`
- `Contact`

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

The site generates localized static builds with these paths:

- `/` for English
- `/de/` for German
- `/uk/` for Ukrainian

Language selection is preserved through locale persistence logic so repeat visits stay on the previously selected language.

## Content Model

Non-home page content is stored in markdown files:

```text
src/assets/content/{locale}/{page}.md
```

Examples:

- `src/assets/content/en/about-me.md`
- `src/assets/content/de/projects.md`
- `src/assets/content/uk/contact.md`

Page registration lives in:

- `src/app/core/content/content-registry.json`

This keeps the site content easy to edit without touching Angular components.

## Project Structure

```text
src/
  app/
    core/                # app shell, locale logic, content services
    features/
      home/              # home page and particle sphere
    shared/
      ui/                # reusable UI and markdown content page shell
  assets/
    content/             # localized markdown content
    i18n/                # translation files
public/                  # static public assets
scripts/                 # build and preview helper scripts
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

The project uses hash-based routing so deep links remain stable on static hosting.

## Home Page

The home page contains:

- a full-bleed particle scene
- a centered fox emblem

The heavy visual logic is lazy-loaded so the rest of the site stays lightweight.

## Quality Gates

Before start, test, and build, the project runs checks for:

- repository hygiene
- markdown content completeness
- locale bootstrap generation

This reduces drift between localized builds, static preview, and deployment output.

## Notes

- `npm run start` is the best way to validate language switching and refresh behavior.
- Markdown content is intentionally separated from Angular view code to keep page editing simple.

## License

This repository is personal project code unless a different license is added later.
