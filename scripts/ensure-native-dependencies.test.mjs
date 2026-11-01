import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { ensureNativeDependencies } from './ensure-native-dependencies.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'personal-site-dependencies-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'node_modules'));
  writeFileSync(join(root, 'package-lock.json'), '{"lockfileVersion":3}');
  const calls = [];
  const options = {
    root,
    platform: 'linux',
    arch: 'arm64',
    abi: '137',
    log: () => {},
    run: (command, args) => {
      calls.push([command, args]);
      return { status: 0 };
    },
  };
  const marker = join(root, 'node_modules/.personal-site-runtime.json');
  return { root, options, calls, marker };
}

test('adopts and reuses a healthy installation without running npm', (t) => {
  const { options, calls, marker } = fixture(t);
  ensureNativeDependencies(options);
  ensureNativeDependencies(options);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(([, args]) => args[0] === '-e'));
  assert.equal(JSON.parse(readFileSync(marker, 'utf8')).platform, 'linux');
});

for (const change of [{ platform: 'darwin' }, { arch: 'x64' }, { abi: '127' }]) {
  test(`repairs a runtime change ${JSON.stringify(change)} before verification`, (t) => {
    const { options, calls, marker, root } = fixture(t);
    ensureNativeDependencies(options);
    calls.length = 0;
    const lockBefore = readFileSync(join(root, 'package-lock.json'), 'utf8');
    ensureNativeDependencies({ ...options, ...change });
    assert.ok(calls[0][1].includes('ci'));
    assert.ok(calls[0][1].includes('--include=optional'));
    assert.equal(calls[1][1][0], '-e');
    assert.equal(readFileSync(join(root, 'package-lock.json'), 'utf8'), lockBefore);
    for (const [key, value] of Object.entries(change)) {
      assert.equal(JSON.parse(readFileSync(marker, 'utf8'))[key], value);
    }
  });
}

test('repairs after the lockfile changes', (t) => {
  const { options, calls, root } = fixture(t);
  ensureNativeDependencies(options);
  calls.length = 0;
  writeFileSync(join(root, 'package-lock.json'), '{"lockfileVersion":3,"packages":{}}');
  ensureNativeDependencies(options);
  assert.ok(calls[0][1].includes('ci'));
});

test('repairs incompatible unmarked dependencies and verifies the result', (t) => {
  const { options, marker } = fixture(t);
  const operations = [];
  ensureNativeDependencies({
    ...options,
    run: (_command, args) => {
      operations.push(args.includes('ci') ? 'install' : 'probe');
      return { status: operations.length === 1 ? 1 : 0 };
    },
  });
  assert.deepEqual(operations, ['probe', 'install', 'probe']);
  assert.ok(existsSync(marker));
});

for (const failure of [{ status: 1 }, { status: 0, error: new Error('spawn failed') }]) {
  test(`does not continue after npm failure: ${failure.error?.message || failure.status}`, (t) => {
    const { options, marker } = fixture(t);
    let calls = 0;
    assert.throws(
      () =>
        ensureNativeDependencies({
          ...options,
          run: () => (++calls === 1 ? { status: 1 } : failure),
        }),
      /Dependency repair failed/,
    );
    assert.equal(calls, 2);
    assert.equal(existsSync(marker), false);
  });
}

test('does not mark a successful install healthy if native verification fails', (t) => {
  const { options, marker } = fixture(t);
  assert.throws(
    () =>
      ensureNativeDependencies({
        ...options,
        run: (_command, args) => ({ status: args.includes('ci') ? 0 : 1, stderr: 'wrong binary' }),
      }),
    /still fail after npm ci/,
  );
  assert.equal(existsSync(marker), false);
});

test('a sandbox or permission failure never triggers an install', (t) => {
  const { options, marker } = fixture(t);
  for (const failure of [
    { status: 0, error: new Error('spawn EPERM') },
    { status: 1, stderr: 'Error: spawn EACCES' },
  ]) {
    let calls = 0;
    assert.throws(
      () =>
        ensureNativeDependencies({
          ...options,
          run: () => {
            calls++;
            return failure;
          },
        }),
      /Cannot run the native dependency check/,
    );
    assert.equal(calls, 1);
    assert.equal(existsSync(marker), false);
  }
});
