import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nativeProbe = `
  require('esbuild').transformSync('const value = 1');
  require('rollup');
  require('@parcel/watcher');
  require('lmdb');
`;

export function ensureNativeDependencies({
  root = repositoryRoot,
  run = spawnSync,
  platform = process.platform,
  arch = process.arch,
  abi = process.versions.modules,
  log = console.log,
} = {}) {
  const markerPath = resolve(root, 'node_modules/.personal-site-runtime.json');
  const fingerprint = JSON.stringify({
    platform,
    arch,
    abi,
    lock: createHash('sha256')
      .update(readFileSync(resolve(root, 'package-lock.json')))
      .digest('hex'),
  });
  let previous;
  try {
    previous = readFileSync(markerPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const probe = () => {
    const result = run(process.execPath, ['-e', nativeProbe], { cwd: root, encoding: 'utf8' });
    if (result.error || /\b(?:EPERM|EACCES)\b/.test(result.stderr || '')) {
      throw new Error(
        `Cannot run the native dependency check.\n${result.error?.message || result.stderr}`,
      );
    }
    return result;
  };
  const healthy = (result) => !result.error && result.status === 0;
  // An existing installation predating this guard can be adopted after verification.
  if ((previous === undefined || previous === fingerprint) && healthy(probe())) {
    if (previous !== fingerprint) writeFileSync(markerPath, fingerprint);
    return;
  }

  log(`Preparing dependencies for ${platform}/${arch} (Node ABI ${abi}) using npm ci…`);
  // npm ci preserves the lockfile and replaces the entire incompatible native tree.
  // This script is deliberately not an install hook, so repair cannot recurse.
  const npmCli = process.env.npm_execpath;
  const args = ['ci', '--include=dev', '--include=optional', '--no-audit', '--no-fund'];
  const result = npmCli
    ? run(process.execPath, [npmCli, ...args], { cwd: root, stdio: 'inherit' })
    : run(platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: root, stdio: 'inherit' });
  if (!healthy(result)) {
    throw new Error(
      `Dependency repair failed. Run npm ci on this OS and retry.${result.error ? ` ${result.error.message}` : ''}`,
    );
  }

  const verified = probe();
  if (!healthy(verified)) {
    throw new Error(
      `Native dependencies still fail after npm ci.\n${verified.error?.message || verified.stderr || ''}`,
    );
  }
  writeFileSync(markerPath, fingerprint);
  log('Native dependencies verified.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    ensureNativeDependencies();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
