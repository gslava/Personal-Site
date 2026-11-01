import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { paths, pageInfo, fallbackHtml, canonicalPath } from './portfolio-static.mjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const browserOutputDirectory = resolve(scriptDirectory, '../dist/personal-site/browser');
const siteRootUrl = 'https://gslava.github.io/Personal-Site/';
const personId = `${siteRootUrl}#person`;
const websiteId = `${siteRootUrl}#website`;

const localeMetadata = [
  {
    locale: 'en',
    indexPath: resolve(browserOutputDirectory, 'index.html'),
    url: siteRootUrl,
    title: 'Viacheslav Guzhov | Java, Spring Boot & AI Automation Engineer',
    description:
      'Viacheslav Guzhov is a Berlin-based Java, Spring Boot, and AI automation engineer building backend systems, integrations, and business workflow automation.',
    profileName: 'Viacheslav Guzhov - Java, Spring Boot & AI Automation Engineer',
  },
  {
    locale: 'de',
    indexPath: resolve(browserOutputDirectory, 'de/index.html'),
    url: `${siteRootUrl}de/`,
    title: 'Viacheslav Guzhov | Java, Spring Boot & KI-Automatisierung',
    description:
      'Viacheslav Guzhov ist ein in Berlin ansässiger Java-, Spring-Boot- und KI-Automatisierungsingenieur für Backend-Systeme, Integrationen und Geschäftsprozessautomatisierung.',
    profileName: 'Viacheslav Guzhov - Java, Spring Boot & KI-Automatisierung',
  },
  {
    locale: 'uk',
    indexPath: resolve(browserOutputDirectory, 'uk/index.html'),
    url: `${siteRootUrl}uk/`,
    title: 'Viacheslav Guzhov | Java, Spring Boot та AI Automation Engineer',
    description:
      'Viacheslav Guzhov - Java, Spring Boot та AI automation engineer у Берліні, який створює backend-системи, інтеграції та автоматизацію бізнес-процесів.',
    profileName: 'Viacheslav Guzhov - Java, Spring Boot та AI Automation Engineer',
  },
];

const sitemapUrls = [];
for (const homeMetadata of localeMetadata) {
  const template = readFileSync(homeMetadata.indexPath, 'utf8');
  const base = template.match(/<base href="([^"]+)"/)?.[1] || '/';
  for (const path of paths) {
    const info = pageInfo(homeMetadata.locale, path);
    const metadata = {
      ...homeMetadata,
      indexPath: resolve(dirname(homeMetadata.indexPath), path, 'index.html'),
      url: homeMetadata.url + (path ? canonicalPath(path) + '/' : ''),
      title: info.title + ' | Viacheslav Guzhov',
      description: info.description,
      profileName: info.title,
      path,
    };
    if (!existsSync(homeMetadata.indexPath)) {
      throw new Error(`Missing localized index file: ${homeMetadata.indexPath}`);
    }

    const jsonLd = buildJsonLd(metadata);
    let html = template;

    html = replaceRequired(
      html,
      /<title(?:\s[^>]*)?>[\s\S]*?<\/title>/,
      `<title>${escapeHtmlText(metadata.title)}</title>`,
      metadata.indexPath,
      'title',
    );
    html = replaceRequired(
      html,
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${escapeHtmlAttribute(metadata.description)}">`,
      metadata.indexPath,
      'description',
    );
    html = replaceRequired(
      html,
      /<link rel="canonical"[^>]*>/,
      `<link rel="canonical" href="${metadata.url}">`,
      metadata.indexPath,
      'canonical',
    );
    html = replaceRequired(
      html,
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">\n${jsonLd}\n    </script>`,
      metadata.indexPath,
      'JSON-LD',
    );

    html = html.replace(/<link rel="alternate" hreflang="[^"]+"[^>]*>/g, '');
    html = html.replace(/<!-- portfolio-meta -->[\s\S]*?<!-- \/portfolio-meta -->/g, '');
    html = html.replace(/<link data-portfolio-preload[^>]*>/g, '');
    const alternates = [...localeMetadata, { ...localeMetadata[0], locale: 'x-default' }]
      .map(
        (item) =>
          `<link rel="alternate" hreflang="${item.locale}" href="${item.url}${path ? canonicalPath(path) + '/' : ''}">`,
      )
      .join('\n');
    const social = `<!-- portfolio-meta -->
    <meta property="og:type" content="website">
    <meta property="og:locale" content="${{ en: 'en_US', de: 'de_DE', uk: 'uk_UA' }[metadata.locale]}">
    <meta property="og:title" content="${escapeHtmlAttribute(metadata.title)}">
    <meta property="og:description" content="${escapeHtmlAttribute(metadata.description)}">
    <meta property="og:url" content="${metadata.url}">
    <meta property="og:image" content="${siteRootUrl}images/viacheslav-guzhov.jpg">
    <meta property="og:image:width" content="1203">
    <meta property="og:image:height" content="1292">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtmlAttribute(metadata.title)}">
    <meta name="twitter:description" content="${escapeHtmlAttribute(metadata.description)}">
    <meta name="twitter:image" content="${siteRootUrl}images/viacheslav-guzhov.jpg">
    <!-- /portfolio-meta -->`;
    html = html.replace('</head>', alternates + social + '</head>');
    html = html.replace(
      /<app-root[^>]*>[\s\S]*?<\/app-root>/,
      '<app-root>' + fallbackHtml(metadata.locale, path, base) + '</app-root>',
    );
    mkdirSync(dirname(metadata.indexPath), { recursive: true });
    writeFileSync(metadata.indexPath, html);
    if (canonicalPath(path) === path) sitemapUrls.push(metadata.url);
  }
}
writeFileSync(
  resolve(browserOutputDirectory, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    sitemapUrls.map((url) => '<url><loc>' + url + '</loc></url>').join('') +
    '</urlset>',
);
console.log(
  `Static routes and SEO metadata generated: ${paths.length * localeMetadata.length} pages, ${sitemapUrls.length} canonical URLs.`,
);

function replaceRequired(html, pattern, replacement, filePath, label) {
  if (!pattern.test(html)) {
    throw new Error(`Could not find ${label} in ${filePath}`);
  }

  return html.replace(pattern, replacement);
}

function buildJsonLd(metadata) {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': personId,
          name: 'Viacheslav Guzhov',
          url: siteRootUrl,
          email: 'mailto:guzhov.viacheslav@gmail.com',
          jobTitle: 'Senior Software & Automation Engineer',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Berlin',
            addressCountry: 'DE',
          },
          alumniOf: {
            '@type': 'CollegeOrUniversity',
            name: 'Kharkiv National University of Radio Electronics',
            url: 'https://nure.ua/en',
          },
          sameAs: ['https://www.linkedin.com/in/viacheslav-guzhov/', 'https://github.com/GSlava'],
          knowsAbout: [
            'Java',
            'Python',
            'Full-stack development',
            'Data analysis',
            'Spring Boot',
            'Backend development',
            'Business process automation',
            'AI integration',
            'Retrieval-augmented generation (RAG)',
            'Vector databases',
            'AI agents',
            'Model Context Protocol (MCP)',
            'Microservices',
            'API integrations',
            'PostgreSQL',
            'AWS',
          ],
        },
        {
          '@type': 'WebSite',
          '@id': websiteId,
          url: siteRootUrl,
          name: 'Viacheslav Guzhov',
          inLanguage: ['en', 'de', 'uk'],
          publisher: {
            '@id': personId,
          },
        },
        {
          '@type': metadata.path ? 'WebPage' : 'ProfilePage',
          '@id': `${metadata.url}#profile-page`,
          url: metadata.url,
          name: metadata.profileName,
          inLanguage: metadata.locale,
          mainEntity: {
            '@id': personId,
          },
        },
      ],
    },
    null,
    6,
  );
}

function escapeHtmlText(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value) {
  return escapeHtmlText(value).replace(/"/g, '&quot;');
}
