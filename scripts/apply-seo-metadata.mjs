import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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

for (const metadata of localeMetadata) {
  if (!existsSync(metadata.indexPath)) {
    throw new Error(`Missing localized index file: ${metadata.indexPath}`);
  }

  const jsonLd = buildJsonLd(metadata);
  let html = readFileSync(metadata.indexPath, 'utf8');

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

  writeFileSync(metadata.indexPath, html);
  console.log(`SEO metadata applied: ${metadata.indexPath}`);
}

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
          sameAs: ['https://www.linkedin.com/in/viacheslav-g-996039b7/'],
          knowsAbout: [
            'Java',
            'Spring Boot',
            'Backend development',
            'Business process automation',
            'AI integration',
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
          '@type': 'ProfilePage',
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
