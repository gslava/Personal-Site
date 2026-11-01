# Personal Site

Localized Angular 21 portfolio for Java backend development and practical AI automation.
The supported languages are English, German and Ukrainian. Content emphasizes
personal contributions, concrete project workflows and experience relevant to employers.

## Pages

- Home: role, AI automation & RAG and Java Spring Boot focus lines, short introduction,
  compact project list, experience summary and contact.
- `/work/`: five case studies plus five additional project summaries. Home features three cases.
- `/work/inventory-management/`
- `/work/order-processing/`
- `/work/company-knowledge-assistant/`
- `/work/amazon-ads/`
- `/work/product-content-creation/`: a standalone AI content service with a unified
  catalog for Amazon, Walmart, BestBuy, Sears and eBay, plus product statistics.
- `/about/`: illustrated avatar, full work experience, grouped technologies, RAG/AI automation,
  education and CV-backed language levels.
- `/experience/`: legacy URL that redirects to About in Angular. Its static fallback
  contains the full profile and canonicals point to About.
- `/contact/`: email, LinkedIn, GitHub, downloadable CV and visible Telegram and WhatsApp links.
- `/experiments/`: Particle Sphere, Interactive Particles, Neural Field, Service Constellation
  and MonkShift, a native macOS focus utility linked directly to its GitHub repository.
- `/experiments/particles/`: the existing interactive particle field.
- `/experiments/interactive-particles/`: three images made of particles that respond to pointer, touch and keyboard input.
- `/experiments/neural-field/`: a violet/cyan web attracted by the cursor, with spreading click impulses.
- `/experiments/service-constellation/`: seven teal/amber clusters with moving connections and cursor-driven vortices.

Primary navigation contains Work, About, Contact and CV. The provided English CV is
served unchanged at `cv/viacheslav-guzhov-cv.pdf` relative to each locale's base URL.

English uses the deployment root. German and Ukrainian insert `de/` and `uk/`
before the route, for example `/uk/work/amazon-ads/`. Language switching retains
the current page and fragment. GitHub Pages repository prefixes are supported.
The old Home anchors remain available; `#education`, `#about-me` and `#technologies` forward to the matching About sections.

## Development

Use **Node 22 or 24** on Linux or macOS.

The npm start, dev, build, test and lint commands check native dependencies before
launching Angular. When a shared checkout switches OS, CPU architecture or Node
ABI, they automatically run `npm ci` to install the locked dependencies for the
current runtime. The first launch after switching can need network access; later
launches reuse the compatible installation. `package-lock.json` is not changed.
You can also run the check explicitly with `npm run check:dependencies`.

Stop running watchers/builds before switching OS: the repair replaces
`node_modules`, so simultaneous Linux and macOS processes need separate checkouts.
Use the npm scripts; invoking `ng` directly bypasses this check.

```bash
npm install
npm run start
```

Open <http://localhost:4200/>. The preview builds all three locales, generates
static route documents after successful builds, and serves the output.
Static generation uses Angular's completed-build event, after output files have
been written, for both the initial build and watched rebuilds.
Wait for “Static routes and SEO metadata generated” before testing a rebuild.

```bash
npm run start:dev
```

Angular dev mode is useful for component edits, but is not authoritative for
localized routes, locale persistence or static-hosting behavior.

## Content and architecture

The active portfolio copy lives in:

`src/app/core/content/portfolio-content.json`

Each locale has the same shape. Projects have stable slugs, a short summary,
three at-a-glance points (challenge, contribution, result), 3–5 stack entries,
a `featured` flag for the Home selection,
a simplified ordered workflow and three detailed sections. Work shows the
project-specific contribution; Home uses shorter summaries. These workflow
diagrams summarize documented functionality, not deployment architecture.
Use verified information; do not invent metrics or technical decisions.

Order Processing and Company Knowledge Assistant remain separate cases, but are
modules accessed from Inventory Management System. Their case pages link to IMS
and to each other. Product Content Creation is a separate service, promoted from
additional work; its confirmed scope covers AI content, editing/export, a catalog
across five marketplaces and product statistics. These relationships and functions
were confirmed by the owner on 2026-10-02. Research-based additions to the Ads
image are UI examples; Monthly Campaigns denotes monthly campaign reporting.

The owner confirmed the employee-facing knowledge assistant using RAG, a vector
knowledge base, file/database access, MCP and Skills, as well as the internal
services portal, product decision report, AI review analysis and Python.
Dates for these newly described projects remain unspecified;
related case links are not attached to a particular employer or period.
The CV supports dates, language levels, languages/frameworks, testing, AWS and delivery
responsibilities; it is not an exhaustive record of the owner's work. Do not assign
unconfirmed vector database products or technologies to individual projects.
`PORTFOLIO_REVIEW.md` contains optional, unconfirmed copy for owner review only;
it is not shipped as a site asset. The downloadable source CV contains
approximate achievement figures; these are not independently presented as verified
website KPIs.

The former Markdown resume files have been removed. Visible copy is maintained
in `portfolio-content.json`; Markdown resume assets are not included in the build.

Key files:

- `src/app/app.routes.ts`: Angular routes; Home loads with the entry bundle, particles remain lazy.
- `src/app/features/portfolio/`: shared portfolio page layouts.
- `src/app/core/layout/site-shell/`: navigation, mobile disclosure, skip link, footer.
- `src/app/features/experiments/`: particle page and lazy procedural WebGL experiments.
- `src/app/features/home/components/particle-sphere/`: preserved particle engine.
- `src/app/core/locale/`: locale and deployment-prefix handling.
- `scripts/portfolio-static.mjs`: static route registry, summaries and readable fallback.
- `scripts/apply-seo-metadata.mjs`: static route HTML, per-page metadata and sitemap.
- `src/app/core/services/page-metadata.service.ts`: metadata during Angular navigation.

When adding a route, update the Angular routes and static route registry together.
When adding a top-level route, also update `locale-contract.json` route roots.
`npm run check:static` checks generated documents after a build.

## Design and motion

Graphite surfaces, off-white text, a copper accent and the preserved fox mark.
The text-led Home has no decorative image download. Project pages show the restored
interface illustrations with transparent space around their browser windows.
Desktop hover crossfades monochrome into color, lifts the artwork slightly and
reveals a soft shadow. On touch devices, this happens one second after image load.
Reduced motion removes the lift. Images retain
responsive WebP versions and localized alt text. Clicking artwork does not navigate.
The illustrations
use fictional records, share consistent IMS module navigation and summarize
documented functions; they are not screenshots of company systems. Earlier SVG
schematics remain as historical sources. Technologies on About separate programming
languages from backend frameworks and list individual technologies within each group.
About uses a minimal, hand-drawn avatar with a transparent background and
ivory/copper linework. Social previews retain the original photograph.
Asset details are documented in
[IMAGE_ASSETS.MD](IMAGE_ASSETS.MD).

The layout uses a compact mobile hierarchy, readable metadata, visible focus,
a skip link, and a full-screen mobile menu built with a native modal dialog.
Menu text rises through clipped rows, rules draw from the left, and the close
button circle draws in; opening settles within 560ms and closing takes 240ms.
The dialog contains keyboard focus, supports Escape, preserves the page scroll
position, and closes on navigation or a switch to desktop width. CV and locale
links remain available inside the menu.

H1 text enters by its actual wrapped lines. Section headings rise gently and
selected horizontal rules draw once on first intersection. Resting content is
visible by default; descriptions and actions do not wait for these animations.
Motion respects initial and live reduced-motion preferences and releases its
observers and animations when a page is destroyed. The footer links to the
experiment collection.

Three.js remains lazy and is loaded by the two particle experiment routes. Simulation behavior
is unchanged; its pause control removes the renderer and restart creates a fresh
simulation. The mechanics remain documented in `PARTICLES.MD` and
`PARTICLES_MOVEMENT.MD`.

Interactive Particles samples one of three original local images (fox, owl,
jellyfish) into instanced monochrome particles. A fading interaction texture
creates displacement and recovery, inspired by Bruno Imbrizi's Codrops tutorial.
The sole setting is image choice. Pointer/touch and arrow keys interact with the
image; reduced motion disables idle animation and uses direct input updates.
Hidden/offscreen scenes stop rendering, and unavailable WebGL retains the source
image and image choices. See the separate image-field section in `PARTICLES.MD`.

The two abstract network scenes use locally bundled tsParticles 4.4 (engine and
slim), downloaded only on their routes. Native tsParticles draws the points,
proximity links and hover connections. A container plugin places the particles
before spatial-grid updates: neural points gently gather around attention;
service clusters rotate independently while relay points travel between them.
Click/tap or Send a pulse launches a bounded wave. Density selects 480/660/840
points on desktop and 260/360/460 on narrow canvases at initialization. The response
slider controls cursor deformation and pulse strength. Arrow keys move attention,
Enter sends a pulse, and Space toggles pause with the canvas focused. Touch supports
taps and sideways drags while vertical scrolling remains available. Reduced motion
starts paused, with explicit play available; hidden/offscreen fields suspend their
animation. Navigation and density changes destroy the old container. These are
artistic metaphors, not biological models or live service telemetry. Fallback previews are WebP captures of the actual tsParticles scenes.

Event Horizon, Neon Megacity and Orbital Earth have been removed from the gallery
and public routes.

Controls support pointer/touch, arrow keys, Space to pause, speed and reset. Cinema
mode fills the viewport, traps keyboard focus and restores focus/scroll on exit.
Reduced motion starts on a still frame; users can explicitly play. Animation pauses
when hidden or outside the viewport; navigation releases shaders, textures and
framebuffers. Context restoration recreates the renderer; unavailable WebGL shows
an actual scene preview and a retry control. No-JS pages keep images and explanations.

Automatic rendering starts at a maximum of 1100×720 and lowers resolution after
sustained slow frame cadence. Performance mode uses 65% of the default dimensions;
High detail is bounded by 1600×1000. The animation loop is capped at 30 fps; this is
a workload limit, not a claim that every GPU sustains 30 fps. Real-device performance
and other browsers require separate validation. Quality changes do not reload the
page or contact a server. New preview provenance is in IMAGE_ASSETS.MD.

Simplified workflow diagrams are explanatory summaries, not product screenshots
or independently verified system artifacts. Publishable, anonymized product evidence
remains a future content task.

## Static hosting and SEO

```bash
npm run build
npm run check:static
```

Output: `dist/personal-site/browser`.

The postbuild step emits **39 route documents** and **36 canonical sitemap URLs**
(the three legacy Experience documents point to About), including
title, description, canonical, hreflang, Open Graph/Twitter metadata, Person/WebPage
JSON-LD and sitemap. Each document contains a readable text fallback before Angular
loads, so navigation, case descriptions and contacts remain available without JS.
This fallback is deliberately simpler than the interactive design, not Angular SSR.
Critical-CSS inlining is disabled: the fallback is inserted after Angular builds,
so Angular cannot include its styles in the critical subset. Loading the small global
stylesheet normally prevents an unstyled fallback and layout shifts on first paint.

The canonical production origin currently remains
`https://gslava.github.io/Personal-Site/`. Before changing domains, update it in
the SEO script, metadata service, source index and robots configuration.

Cloudflare Pages:

- Build command: `npm run build`
- Output: `dist/personal-site/browser`

GitHub Pages:

```bash
GITHUB_PAGES_BASE_HREF=/Personal-Site/ npm run build:github
GITHUB_PAGES_BASE_HREF=/Personal-Site/ npm run check:static
```

Use the actual repository prefix, including its case. Use the npm build commands:
calling `ng build` directly does not run the SEO/static-route postbuild step.

## Validation

```bash
npm run check:content
npm run lint
npm run test -- --watch=false --progress=false
npm run build -- --localize --progress=false
npm run check:static
```

Also verify direct route loads, locale switching, browser Back, mobile menu,
keyboard focus, reduced motion and WebGL cleanup against the localized preview.
A production deployment and real-device GPU performance require separate checks.

## Scope

The original CV is available for download. No contact backend, analytics, domain
change or deployment is included in this refinement.
