import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fallbackHtml } from './portfolio-static.mjs';
const data = JSON.parse(
  readFileSync(new URL('../src/app/core/content/portfolio-content.json', import.meta.url), 'utf8'),
);
const expectedSlugs = [
  'inventory-management',
  'order-processing',
  'company-knowledge-assistant',
  'amazon-ads',
  'product-content-creation',
];
for (const [locale, text] of Object.entries(data)) {
  assert.deepEqual(
    Object.keys(text).sort(),
    Object.keys(data.en).sort(),
    locale + ': missing translations',
  );
  assert.deepEqual(
    text.projects.map((p) => p.slug),
    expectedSlugs,
    locale + ': project route parity',
  );
  const experimentBase = '/Personal-Site/' + (locale === 'en' ? '' : locale + '/');
  const experimentIndex = fallbackHtml(locale, 'experiments', experimentBase);
  assert.deepEqual(text.cinematicExperiments, []);
  assert(
    experimentIndex.indexOf('experiments/particles/') <
      experimentIndex.indexOf('experiments/interactive-particles/'),
  );
  assert(!experimentIndex.includes('experiments/event-horizon/'));
  assert(!experimentIndex.includes('experiments/neon-city/'));
  assert(!experimentIndex.includes('experiments/abyssal-bloom/'));
  assert.deepEqual(Object.keys(text.cinematicLab).sort(), Object.keys(data.en.cinematicLab).sort());
  assert.equal(text.cinematicLab.qualityOptions.length, 3);
  assert.equal(text.imageParticles.images.length, 3);
  assert.deepEqual(
    Object.keys(text.networkFields).sort(),
    Object.keys(data.en.networkFields).sort(),
  );
  assert.equal(text.networkFields.densities.length, 3);
  for (const key of ['neural', 'services']) {
    const scene = text.networkFields[key];
    assert.deepEqual(Object.keys(scene).sort(), Object.keys(data.en.networkFields[key]).sort());
    assert.equal(scene.slug, data.en.networkFields[key].slug);
    assert(experimentIndex.includes(experimentBase + 'experiments/' + scene.slug + '/'));
    const networkFallback = fallbackHtml(locale, 'experiments/' + scene.slug, experimentBase);
    assert(networkFallback.includes(scene.note.replaceAll('&', '&amp;')));
    assert(networkFallback.includes(experimentBase + 'images/experiments/' + scene.slug + '.webp'));
    assert(
      existsSync(new URL('../public/images/experiments/' + scene.slug + '.webp', import.meta.url)),
    );
  }
  assert.deepEqual(
    Object.keys(text.imageParticles).sort(),
    Object.keys(data.en.imageParticles).sort(),
  );
  assert(experimentIndex.includes(experimentBase + 'experiments/interactive-particles/'));
  const imageFallback = fallbackHtml(locale, 'experiments/interactive-particles', experimentBase);
  for (const name of ['fox', 'owl', 'jellyfish']) {
    assert(
      existsSync(new URL('../public/images/particle-images/' + name + '.png', import.meta.url)),
    );
    assert(imageFallback.includes(experimentBase + 'images/particle-images/' + name + '.png'));
  }
  assert.equal(text.nav.length, 5);
  assert.equal(text.projects.length, 5);
  assert.equal(text.additional.length, 5);
  assert.equal(text.jobs.length, 2);
  assert.equal(text.capabilityItems.length, 7);
  assert.deepEqual(text.capabilityItems[0].items, [
    'Java',
    'Python',
    'TypeScript',
    'JavaScript',
  ]);
  for (const group of text.capabilityItems) {
    assert(group.title.trim().length > 0 && group.items.length > 0);
  }
  assert(!('aboutDetail' in text) && !('practiceTitle' in text) && !('practiceItems' in text));
  assert.equal(text.heroBackend, 'Java Spring Boot');
  assert(!text.projects.find((p) => p.slug === 'amazon-ads').stack.includes('RabbitMQ'));
  assert.equal(text.projects.filter((p) => p.featured).length, 3);
  assert.equal(text.caseSummaryLabels.length, 3);
  assert.equal(text.caseLabels.length, 3);
  assert.equal(text.languageItems.length, 3);
  assert(text.aiDescription.includes('RAG'));
  assert(text.cvNote.includes('PDF'));
  assert(text.portraitAlt.trim().length > 10);
  assert(existsSync(new URL('../public/cv/viacheslav-guzhov-cv.pdf', import.meta.url)));
  assert(!('evidence' in text) && !('metricLabels' in text), locale + ': old KPI copy');
  for (const p of text.projects) {
    assert.deepEqual(Object.keys(p).sort(), Object.keys(data.en.projects[0]).sort());
    assert.equal(p.sections.length, text.caseLabels.length, p.slug + ': missing case section');
    assert(p.sections.every((s) => s.trim().length > 30));
    assert.equal(p.snapshot.length, 3, p.slug + ': incomplete case summary');
    assert(
      p.snapshot.every((s) => s.trim().length > 30),
      p.slug + ': weak case summary',
    );
    assert(!('metric' in p) && !('metricLabel' in p), p.slug + ': old metric claim');
    assert(p.stack.length >= 3 && p.stack.length <= 5);
    assert(p.workflow.length >= 3 && p.workflow.length <= 4);
    assert(p.workflow.every((step) => step.trim().length > 5));
    assert(p.contribution.length > 20);
    assert(p.imageAlt.trim().length > 20, p.slug + ': missing interface description');
    assert.equal(new Set(p.relatedSlugs).size, p.relatedSlugs.length);
    for (const related of p.relatedSlugs) {
      assert(
        related !== p.slug && expectedSlugs.includes(related),
        p.slug + ': invalid connection',
      );
      assert(
        fallbackHtml(locale, 'work/' + p.slug, experimentBase).includes(
          experimentBase + 'work/' + related + '/',
        ),
        p.slug + ': missing static connection',
      );
    }
    for (const suffix of ['', '-768', '-1024']) {
      assert(
        existsSync(
          new URL('../public/images/projects/' + p.slug + suffix + '.webp', import.meta.url),
        ),
      );
    }
    const caseImage = fallbackHtml(locale, 'work/' + p.slug, experimentBase);
    assert(caseImage.includes(experimentBase + 'images/projects/' + p.slug + '.webp'));
  }
  const homeFallback = fallbackHtml(locale, '', '/');
  const caseFallback = fallbackHtml(locale, 'work/order-processing', '/');
  const workFallback = fallbackHtml(locale, 'work', '/');
  for (const p of text.projects) {
    assert.equal(typeof p.featured, 'boolean');
    assert(workFallback.includes('work/' + p.slug + '/'), locale + ': Work case missing');
    assert.equal(
      homeFallback.includes('work/' + p.slug + '/'),
      p.featured,
      locale + ': featured case parity',
    );
  }
  for (const p of text.additional) {
    assert.equal(p.length, 3);
    assert(p.every((part) => part.trim().length > 5));
    assert(
      workFallback.includes(p[1].replaceAll('&', '&amp;')),
      locale + ': additional work missing',
    );
  }
  const knowledgeFallback = fallbackHtml(
    locale,
    'work/company-knowledge-assistant',
    '/Personal-Site/',
  );
  assert(knowledgeFallback.includes('MCP'));
  assert(!/~(?:70|80|95)%|5×/.test(homeFallback + caseFallback));
  assert(caseFallback.includes(text.caseSummaryTitle));
  assert(caseFallback.includes(text.projects[1].snapshot[1]));
  assert(!/captcha|Lorem ipsum/i.test(JSON.stringify(text)));
  const prefix = '/Personal-Site/' + (locale === 'en' ? '' : locale + '/');
  const profileFallback = fallbackHtml(locale, 'about', prefix);
  assert(profileFallback.includes('href="' + prefix + 'cv/viacheslav-guzhov-cv.pdf"'));
  assert(profileFallback.includes(text.aiDescription));
  assert(profileFallback.includes('Python'));
  assert(profileFallback.includes('TypeScript'));
  assert(profileFallback.includes('JavaScript'));
  assert(homeFallback.includes('Java Spring Boot'));
  assert.equal(fallbackHtml(locale, 'experience', prefix), profileFallback);
  assert(!homeFallback.includes(text.jobs[0].bullets[0]), locale + ': Home must stay concise');
}
console.log(
  'Portfolio content verified: EN/DE/UK, five cases, five additional works, three featured cases, IMS connections, workflows and CV.',
);
