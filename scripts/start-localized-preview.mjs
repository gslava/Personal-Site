import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const children = [];

function spawnChild(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  children.push(child);
  child.on('error', (error) => {
    console.error(`Cannot start ${command}: ${error.message}`);
    shutdown(1);
  });
  return child;
}

function shutdown(exitCode = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const buildWatcher = spawnChild(process.execPath, [
  resolve(scriptDirectory, 'watch-localized-build.mjs'),
]);
const staticServer = spawnChild('python3', [
  '-m',
  'http.server',
  '4200',
  '-d',
  'dist/personal-site/browser',
]);

buildWatcher.on('exit', (code) => {
  shutdown(code ?? 1);
});

staticServer.on('exit', (code) => {
  shutdown(code ?? 1);
});
