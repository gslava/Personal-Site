import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const ignoredDirectories = new Set([
  '.angular',
  '.git',
  '.idea',
  'dist',
  'node_modules',
]);
const junkFileNames = new Set(['Thumbs.db']);
const junkFiles = [];
const checkedRoots = ['src', 'public', 'scripts'];

function walk(directoryPath) {
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }

      walk(join(directoryPath, entry.name));
      continue;
    }

    if (!entry.isFile() || !junkFileNames.has(entry.name)) {
      continue;
    }

    const absolutePath = join(directoryPath, entry.name);
    const relativePath = relative(repositoryRoot, absolutePath) || entry.name;

    if (statSync(absolutePath).isFile()) {
      junkFiles.push(relativePath);
    }
  }
}

for (const checkedRoot of checkedRoots) {
  walk(resolve(repositoryRoot, checkedRoot));
}

if (junkFiles.length > 0) {
  console.error('Repository hygiene check failed. Remove junk files:');

  for (const junkFile of junkFiles) {
    console.error(`- ${junkFile}`);
  }

  process.exit(1);
}

console.log(`Repository hygiene verified in: ${checkedRoots.join(', ')}`);
