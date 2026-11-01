import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { paths, canonicalPath } from './portfolio-static.mjs';
const root = resolve('dist/personal-site/browser');
const locales = ['en', 'de', 'uk'];
const expectedPrefix = process.env.GITHUB_PAGES_BASE_HREF || '/';
for (const locale of locales) {
  const localeDir = locale === 'en' ? '' : locale;
  for (const path of paths) {
    const file = resolve(root, localeDir, path, 'index.html');
    const html = readFileSync(file, 'utf8');
    const expectedBase = expectedPrefix + (locale === 'en' ? '' : locale + '/');
    assert(html.includes('<base href="' + expectedBase + '"'), file + ': deployment base');
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, file + ': one static H1');
    assert(html.includes('mailto:guzhov.viacheslav@gmail.com'), file + ': usable contact fallback');
    assert.equal((html.match(/property="og:title"/g) || []).length, 1, file + ': one OG title');
    assert.equal((html.match(/name="twitter:card"/g) || []).length, 1, file + ': one Twitter card');
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    const stylesheet = html.match(/<link\b[^>]*rel="stylesheet"[^>]*>/)?.[0];
    assert(
      stylesheet && !stylesheet.includes('media="print"') && !stylesheet.includes('onload='),
      file + ': static fallback stylesheet must load before first paint',
    );
    assert(!html.includes('data-portfolio-preload'), file + ': no decorative hero preload');
    assert(
      existsSync(resolve(root, localeDir, 'cv/viacheslav-guzhov-cv.pdf')),
      file + ': CV asset',
    );
    assert(
      existsSync(resolve(root, localeDir, 'images/viacheslav-guzhov.jpg')),
      file + ': original portrait',
    );
    assert(existsSync(resolve(root, localeDir, 'images/fox-64.webp')), file + ': optimized logo');
    for (const lang of [...locales, 'x-default'])
      assert(html.includes('hreflang="' + lang + '"'), file + ': alternates');
    const canonical =
      'https://gslava.github.io/Personal-Site/' +
      (locale === 'en' ? '' : locale + '/') +
      (path ? canonicalPath(path) + '/' : '');
    assert(html.includes('rel="canonical" href="' + canonical + '"'), file + ': canonical route');
    const json = JSON.parse(
      html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
    );
    assert(json['@graph'].some((item) => item['@type'] === 'Person'));
    for (const match of html.matchAll(/<script[^>]* src="([^"]+)"/g)) {
      assert(existsSync(resolve(root, localeDir, match[1])), file + ': missing script ' + match[1]);
    }
  }
}
const sitemap = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
const canonicalCount = paths.filter((path) => canonicalPath(path) === path).length * locales.length;
assert.equal((sitemap.match(/<loc>/g) || []).length, canonicalCount);
console.log(
  `Static output verified: ${paths.length * locales.length} direct routes, deployment bases, scripts, SEO, readable fallback, CV and ${canonicalCount} canonical sitemap URLs.`,
);
