# Architecture Review

This document captures the main architecture improvements worth making before publishing the project more widely.

## Executive Summary

If only a few improvements are made before public launch, these should be the first ones:

1. Consolidate locale/bootstrap logic into a true single-source system.
2. Stop using absolute asset paths that can break under GitHub Pages base paths.
3. Treat localized static preview as the main verification runtime for i18n behavior.
4. Break the particle runtime into smaller TypeScript modules before it grows further.
5. Add a small CI pipeline that validates the real deployment shape.

## What Is Already Good

- The project uses a modern Angular 21 standalone setup with strict TypeScript and a clean feature-first folder structure.
- The site is correctly optimized for static hosting targets and already accounts for both Cloudflare Pages and GitHub Pages constraints.
- The Home page effect is isolated behind a dedicated component and lazy-loads `three`, which is the right direction for a marketing-style landing page.
- Markdown-based content is a good editorial decision for a personal site because it keeps content updates cheap and repository-friendly.

## Highest-Value Improvements

### 1. Reduce duplicate locale logic and make boot-time locale resolution a single-source system

**Current state**

- Locale resolution exists in more than one place:
  - `src/index.html`
  - `src/app/core/locale/locale-bootstrap.util.ts`
  - `src/app/core/services/locale.service.ts`
  - `src/app/core/services/locale-persistence.service.ts`

**Why this matters**

- Locale switching is one of the most fragile parts of this project.
- The same rules currently exist at bootstrap time and runtime, but they are not physically shared from one executable source.
- This increases the chance of regressions where one code path is fixed and another keeps the old behavior.

**Recommendation**

- Keep one canonical locale rules module and generate the bootstrap logic from it, or keep the bootstrap logic intentionally minimal and let Angular own the rest.
- Centralize:
  - supported locales
  - cookie name
  - cookie lifetime
  - locale path parsing
  - localized path building
- The practical target should be: one place defines locale rules, all other layers consume them.

### 2. Treat localized preview as a first-class runtime, not a side workflow

**Current state**

- `npm run start` uses `ng serve`.
- The real product behavior for locale switching only exists in a localized static build.
- The repository already knows this implicitly through:
  - `preview:localize:build`
  - `preview:localize:serve`

**Why this matters**

- Developers can easily verify the wrong runtime and miss bugs that only appear in the real deployment shape.
- This already happened with locale switching.

**Recommendation**

- Document the localized static preview as the primary verification path for i18n behavior.
- Consider making the default review command a production-like preview instead of relying on `ng serve` for everything.
- Add a short “when to use `start` vs when to use localized preview” section to `README.md`.

### 3. Remove absolute public asset paths that bypass deployment base paths

**Current state**

- The Home page loads the fox image through an absolute path: `/fox.png`.
- This bypasses repository-relative hosting assumptions.

**Why this matters**

- The project explicitly supports GitHub Pages, which commonly serves the app under a repository base path such as `/personal-site/`.
- Absolute asset paths are fragile in that model and can break even when routing and build output are otherwise correct.

**Recommendation**

- Replace root-absolute asset references with base-aware asset paths.
- Treat all runtime assets as deployment-relative unless there is a deliberate reason to anchor them at the domain root.
- Add one small regression check for root hosting and repository hosting so asset loading cannot silently regress later.

### 4. Split the particle effect runtime into smaller architectural units

**Current state**

- `src/app/features/home/components/particle-sphere/particle-sphere.component.ts` is about 900 lines long.
- It currently mixes:
  - Angular lifecycle
  - DOM event handling
  - resize and visibility management
  - GPU simulation setup
  - shader source construction
  - particle rendering
  - cleanup orchestration

**Why this matters**

- The effect is now one of the most important features of the site.
- A large monolithic component is expensive to debug and risky to tune.
- Future changes to interaction or visuals are likely to reintroduce regressions because simulation, rendering, and orchestration are tightly coupled.

**Recommendation**

- Split the current component into separate units:
  - scene bootstrap / renderer host
  - simulation factory
  - particle material factory
  - input controller
  - resize and visibility controller
  - shader source modules
- Keep Angular responsible only for lifecycle and DOM attachment.
- Keep WebGL orchestration in plain TypeScript modules with explicit contracts.

### 5. Replace repeated page-wrapper components with route-data-driven content pages

**Current state**

- `Technologies`, `Projects`, `About Me`, and `Contact` each have their own page component.
- Those components are almost identical wrappers around the same markdown page renderer.
- Their HTML templates are effectively one-line `pageKey` pass-throughs.

**Why this matters**

- This is acceptable at very small scale, but it creates repetition without buying meaningful separation.
- Repetition will get worse if metadata, analytics hooks, transitions, or page-level policies are added later.

**Recommendation**

- Move to a single generic content page component and drive it with route data:
  - `pageKey`
  - page title
  - optional content settings
- Keep feature-specific components only when a page truly diverges from the generic markdown layout.
- This will also reduce the number of places where page identity has to stay in sync manually.

### 6. Formalize the markdown content pipeline before content grows

**Current state**

- Markdown is loaded directly from `assets/content/{locale}/{page}.md`.
- Rendering is performed through `marked`.
- HTML is injected via `[innerHTML]`.

**Why this matters**

- The current system is fine for a small static site, but it has no explicit content manifest or validation layer.
- As content grows, it becomes harder to guarantee:
  - that every page exists for every locale
  - that content structure is consistent
  - that missing translations are visible during CI rather than at runtime
- Page naming and labels are already duplicated across routes, i18n messages, and `MarkdownContentService`, which is an early sign of metadata drift risk.
- Angular currently sanitizes `[innerHTML]`, so this is not primarily a present-day security bug; the bigger issue is that the content contract is implicit instead of explicit.

**Recommendation**

- Add a small typed content manifest that defines:
  - supported page keys
  - expected localized files
  - optional fallback policy
- Move page labels and other page metadata out of `MarkdownContentService` into one typed metadata source shared by routes and content rendering.
- Add a build-time check that verifies required markdown files exist.
- Explicitly document whether raw HTML inside markdown is allowed or discouraged.

## Medium-Priority Improvements

### 7. Remove or archive stale UI code

**Current state**

- `src/app/shared/ui/section-placeholder-page/` is no longer referenced.

**Why this matters**

- Unused components create false signals about what is active architecture and what is historical residue.

**Recommendation**

- Remove dead code or move it into a clearly marked archive/reference area.

### 8. Tighten repository hygiene for publishing

**Current state**

- The repository root currently mixes runtime assets, project instructions, reference reverse-engineering notes, and implementation planning documents.
- `src/assets/content/` currently contains a stray `.DS_Store` file.
- `src/app/` also contains a stray `.DS_Store` file.
- Some project documentation has already drifted behind the implementation. For example, `README.md` still describes Ukrainian at the root build, while the current source locale is English.

**Why this matters**

- This is workable during active development, but it makes the project look less intentional when shared publicly.
- It also makes the root folder harder to scan for new contributors or future you.
- When docs drift from deployment behavior, operational mistakes become more likely.

**Recommendation**

- Keep essential root documents only.
- Move long-lived technical notes into a dedicated `docs/` structure.
- Keep `reference/` separate for reverse-engineering artifacts.
- Keep operational agent files only where they are truly needed.
- Add a small repository hygiene check so OS-generated files do not get published accidentally.
- Treat `README.md` as release-facing documentation and keep it aligned with the actual i18n and deployment configuration.

### 9. Strengthen tests around real user risks instead of only component smoke tests

**Current state**

- Tests currently cover:
  - app shell smoke
  - locale utilities
  - part of locale service
  - simple home page rendering
- There is little coverage for:
  - markdown fallback behavior
  - content existence per locale
  - localized navigation from real rendered links
  - GitHub Pages base-path behavior at higher level

**Why this matters**

- The major regressions in this project have not been “Angular cannot compile.”
- They have been runtime behavior issues at deployment boundaries.

**Recommendation**

- Add focused tests for:
  - markdown loading and fallback
  - locale link generation for root vs repository deployments
  - localized static preview assumptions
  - Home page non-browser fallback behavior
- If time allows, add one minimal end-to-end smoke path for `EN -> DE -> EN`.

### 10. Add a minimal CI pipeline that validates the real release shape

**Current state**

- The project has local scripts for linting, testing, localized builds, and GitHub Pages builds.
- There is no repository CI workflow that runs them automatically.

**Why this matters**

- This project already has multiple deployment-sensitive paths.
- Without CI, regressions remain easy to reintroduce even if the local workflow is good.

**Recommendation**

- Add one small CI workflow that runs on every push or pull request:
  - `npm ci`
  - `npm run lint`
  - `npm run test -- --watch=false`
  - `npm run build`
  - `npm run build:github` with a representative base href
- This is enough to catch most high-value regressions without overengineering the pipeline.

### 11. Make deployment behavior more explicit in code and documentation

**Current state**

- GitHub Pages support is handled through `scripts/build-github-pages.mjs`.
- The approach is valid, but deployment behavior is still spread across:
  - `angular.json`
  - `package.json`
  - `README.md`
  - bootstrap locale logic
- `public/_headers` adds useful response headers, but that mechanism is host-specific and does not apply equally across both deployment targets.

**Why this matters**

- Static multi-locale deployments are very sensitive to path assumptions.
- The fewer implicit rules here, the better.

**Recommendation**

- Create one short deployment architecture note explaining:
  - why hash routing is used
  - why English lives at root
  - how localized folders are emitted
  - how GitHub Pages base href changes the runtime
- Explicitly document which deployment concerns are shared across hosts and which are Cloudflare-specific only.

### 12. Add a minimal publishing metadata layer

**Current state**

- The app has a localized page title and description.
- It does not yet expose a broader publishing metadata layer such as:
  - social preview metadata
  - canonical strategy
  - robots or sitemap assets
  - theme color metadata

**Why this matters**

- This does not block the app technically, but it lowers the perceived completeness of a public personal site.
- If the project is meant to be shared proudly, browser tabs and social previews should feel intentional too.

**Recommendation**

- Add a minimal public-site metadata pack:
  - `og:title`
  - `og:description`
  - `og:image`
  - `twitter:card`
  - `theme-color`
  - `robots.txt`
  - `sitemap.xml` or a documented decision to defer it

## Lower-Priority but Worthwhile Improvements

### 13. Create a dedicated design-token layer before the visual system expands

**Current state**

- The site already uses root CSS variables, but the token layer is still very small.

**Why this matters**

- As more content pages and states are added, colors, spacing, elevations, and typography rules will otherwise spread informally through SCSS files.

**Recommendation**

- Introduce a slightly more formal token structure for:
  - surfaces
  - borders
  - text roles
  - spacing scale
  - shadows
  - motion durations

### 14. Make content and presentation ownership more explicit

**Current state**

- Content logic, fallback generation, and rendering policy are mostly inside `MarkdownContentService`.

**Why this matters**

- That service currently owns too many decisions:
  - asset path resolution
  - fallback content generation
  - page label localization
  - markdown parsing
- Those concerns change for different reasons and should not need to release together.

**Recommendation**

- Separate responsibilities into:
  - content source resolution
  - fallback policy
  - markdown rendering
  - page metadata labels
