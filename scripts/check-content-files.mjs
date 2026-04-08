import { existsSync, readFileSync } from 'node:fs';
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
const pageKeys = Object.keys(contentRegistry.pages);
const missingFiles = [];

for (const locale of locales) {
  for (const pageKey of pageKeys) {
    const filePath = resolve(contentRoot, locale, `${pageKey}.md`);

    if (!existsSync(filePath)) {
      missingFiles.push(filePath);
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

console.log(`Content registry verified: ${locales.length} locales x ${pageKeys.length} pages.`);
