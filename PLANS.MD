# Current Plan

## Goal

Implement the selected SEO improvements for the personal site without changing the visual design, except for the approved visible content changes:

1. Replace generic page titles and descriptions with role-focused localized SEO metadata.
2. Add canonical and hreflang metadata for the GitHub Pages production URL.
3. Add `sitemap.xml` and `robots.txt`.
4. Replace the first visible `h1` with the approved role-focused heading in all three languages.
5. Add JSON-LD structured data. This must not affect the UI because it is invisible metadata for search engines.
6. Add `X-Robots-Tag: noindex` for public markdown content where the hosting platform supports custom headers.
7. Add LinkedIn contact links after WhatsApp in all three localized content files.

## Confirmed Inputs

- Production site URL: `https://gslava.github.io/Personal-Site/`
- English canonical URL: `https://gslava.github.io/Personal-Site/`
- German canonical URL: `https://gslava.github.io/Personal-Site/de/`
- Ukrainian canonical URL: `https://gslava.github.io/Personal-Site/uk/`
- Structured data is approved.
- Open Graph and Twitter Card metadata are out of scope for this plan.
- `X-Robots-Tag: noindex` should target markdown files under `assets/content/**/*.md`.
- Approved `h1` values:
  - EN: `Viacheslav Guzhov - Java, Spring Boot & AI Automation Engineer`
  - DE: `Viacheslav Guzhov - Java, Spring Boot & KI-Automatisierung`
  - UK: `Viacheslav Guzhov - Java, Spring Boot та AI Automation Engineer`
- Approved LinkedIn link labels:
  - EN: `LinkedIn profile`
  - DE: `LinkedIn-Profil`
  - UK: `Профіль LinkedIn`
- LinkedIn URL: `https://www.linkedin.com/in/viacheslav-g-996039b7/`

## Implementation Steps

1. Update localized page metadata.
   - Replace the generic `HOME` title with a localized title based on the approved positioning.
   - Replace the current generic meta description with localized descriptions focused on Java, Spring Boot, automation, AI integration, and Berlin/Germany.
   - Update the Angular i18n message files so localized builds output the correct title and description for `en`, `de`, and `uk`.

2. Add canonical and hreflang links.
   - Add canonical links for the active locale.
   - Add alternate links for `en`, `de`, `uk`, and `x-default`.
   - Use absolute GitHub Pages URLs with the `/Personal-Site/` base path.
   - Ensure generated localized builds produce:
     - `/Personal-Site/`
     - `/Personal-Site/de/`
     - `/Personal-Site/uk/`

3. Add sitemap and robots files.
   - Add `public/sitemap.xml` with the three localized URLs.
   - Add `public/robots.txt` allowing normal crawling and pointing to `https://gslava.github.io/Personal-Site/sitemap.xml`.
   - Keep the sitemap minimal until separate crawlable section pages exist.

4. Replace the main `h1`.
   - Update the first heading in each localized markdown content file to the approved localized `h1`.
   - Demote the existing `About Me` section heading below it so the page has one clear primary heading.
   - Verify the parser still creates the expected section ids and that the navigation remains correct.

5. Add JSON-LD structured data.
   - Add invisible `application/ld+json` metadata for `Person` and `WebSite`.
   - Include only facts visible on the page: name, role, location, email, LinkedIn, skills/topics, and education.
   - Keep values localized where appropriate, but keep identity fields stable across locales.
   - Verify the JSON is valid and does not render any visible UI.

6. Add `X-Robots-Tag: noindex` for markdown assets.
   - Update `public/_headers` with a rule for markdown content under `/assets/content/*.md` or the closest supported pattern for the deployment target.
   - Keep the existing security headers.
   - Note hosting limitation: Cloudflare Pages supports `_headers`; GitHub Pages generally does not support custom response headers. If GitHub Pages is the primary production host, this header will not be applied there. A follow-up may be needed to avoid publishing raw markdown files or to serve content through generated HTML/JS instead.

7. Add LinkedIn to contact sections.
   - Add the LinkedIn row immediately after WhatsApp in:
     - `src/assets/content/en/all-in-one-page.md`
     - `src/assets/content/de/all-in-one-page.md`
     - `src/assets/content/uk/all-in-one-page.md`
   - Use the approved localized labels and the approved LinkedIn URL.
   - Update repeated contact sections if the same contact block appears more than once in each file.

8. Verify the build and generated output.
   - Run content validation.
   - Run the localized production build.
   - Inspect generated `index.html`, `de/index.html`, and `uk/index.html`.
   - Confirm titles, descriptions, canonical links, hreflang links, structured data, sitemap, robots file, and `_headers` rules are present.
   - Confirm the visible page still renders and the new `h1` appears correctly.

## Verification Commands

1. `npm run check:content`
2. `npm run build:github`
3. Inspect generated files under `dist/personal-site/browser`.

## Out Of Scope

- Open Graph metadata.
- Twitter Card metadata.
- Full prerender/SSG implementation.
- Creating separate crawlable pages for sections such as Projects, Technologies, About Me, and Contact.
- Reworking particle behavior or visual styling.
