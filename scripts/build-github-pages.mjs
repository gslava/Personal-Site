import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rawBaseHref = process.env['GITHUB_PAGES_BASE_HREF'];
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const angularCliBin = resolve(scriptDirectory, '../node_modules/@angular/cli/bin/ng.js');

if (!rawBaseHref) {
  console.error('Missing GITHUB_PAGES_BASE_HREF. Example: GITHUB_PAGES_BASE_HREF=/personal-site/ npm run build:github');
  process.exit(1);
}

const normalizedBaseHref = `/${rawBaseHref.replace(/^\/+|\/+$/g, '')}/`;

try {
  const output = execFileSync(process.execPath, [angularCliBin, 'build', '--localize', '--base-href', normalizedBaseHref, '--progress=false'], {
    encoding: 'utf8',
  });
  process.stdout.write(output);
} catch (error) {
  if (typeof error?.stdout === 'string') {
    process.stdout.write(error.stdout);
  }
  if (typeof error?.stderr === 'string') {
    process.stderr.write(error.stderr);
  }
  process.exit(typeof error?.status === 'number' ? error.status : 1);
}
