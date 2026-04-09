import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const localeContract = JSON.parse(
  readFileSync(resolve(scriptDirectory, '../src/app/core/locale/locale-contract.json'), 'utf8'),
);
const contentRegistry = JSON.parse(
  readFileSync(resolve(scriptDirectory, '../src/app/core/content/content-registry.json'), 'utf8'),
);
const contentRoot = resolve(scriptDirectory, '../src/assets/content');
const locales = localeContract.locales;
const missingFiles = [];
const unexpectedFiles = [];
const invalidFiles = [];
const blockSeparatorPattern = /^\s*---\s*$/gm;
const titlePattern = /^#\s+(.+)$/m;
const expectedSectionOrder = ['about-me', 'work-experience', 'education', 'technologies', 'projects', 'contact'];

for (const locale of locales) {
  const filePath = resolve(contentRoot, locale, 'all-in-one-page.md');

  if (!existsSync(filePath)) {
    missingFiles.push(filePath);
    continue;
  }

  const localeFiles = readdirSync(resolve(contentRoot, locale)).filter((entry) => entry.endsWith('.md'));

  for (const localeFile of localeFiles) {
    if (localeFile !== 'all-in-one-page.md') {
      unexpectedFiles.push(resolve(contentRoot, locale, localeFile));
    }
  }

  const markdown = readFileSync(filePath, 'utf8');
  const blocks = markdown
    .split(blockSeparatorPattern)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length !== expectedSectionOrder.length) {
    invalidFiles.push(`${filePath} (expected ${expectedSectionOrder.length} blocks, found ${blocks.length})`);
    continue;
  }

  const titles = blocks.map((block) => block.match(titlePattern)?.[1]?.trim() ?? '__MISSING__');
  const expectedTitles = expectedSectionOrder.map((key) => contentRegistry.pages[key].labels[locale]);

  for (let index = 0; index < expectedTitles.length; index += 1) {
    if (titles[index] !== expectedTitles[index]) {
      invalidFiles.push(
        `${filePath} (block ${index + 1}: expected "${expectedTitles[index]}", found "${titles[index]}")`,
      );
    }
  }
}

if (missingFiles.length > 0) {
  console.error('Missing markdown content files:');

  for (const missingFile of missingFiles) {
    console.error(`- ${missingFile}`);
  }

  process.exit(1);
}

if (unexpectedFiles.length > 0) {
  console.error('Unexpected markdown content files:');

  for (const unexpectedFile of unexpectedFiles) {
    console.error(`- ${unexpectedFile}`);
  }

  process.exit(1);
}

if (invalidFiles.length > 0) {
  console.error('Invalid single-page markdown structure:');

  for (const invalidFile of invalidFiles) {
    console.error(`- ${invalidFile}`);
  }

  process.exit(1);
}

console.log(`Single-page content verified: ${locales.length} locales x 1 file.`);
