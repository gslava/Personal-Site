import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { Architect } = require('@angular-devkit/architect');
const { WorkspaceNodeModulesArchitectHost } = require('@angular-devkit/architect/node');
const { logging, schema, workspaces } = require('@angular-devkit/core');
const { NodeJsSyncHost } = require('@angular-devkit/core/node');
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, '..');
const { workspace } = await workspaces.readWorkspace(
  root,
  workspaces.createWorkspaceHost(new NodeJsSyncHost()),
);
const registry = new schema.CoreSchemaRegistry();
registry.addPostTransform(schema.transforms.addUndefinedDefaults);
const architect = new Architect(new WorkspaceNodeModulesArchitectHost(workspace, root), registry);
const logger = new logging.Logger('localized-preview');
logger.subscribe(({ level, message }) => {
  (level === 'error' || level === 'fatal' ? console.error : console.log)(message);
});
const run = await architect.scheduleTarget(
  { project: 'personal-site', target: 'build' },
  { localize: true, watch: true, progress: false },
  { logger },
);

let stopping = false;
async function shutdown(code) {
  if (stopping) return;
  stopping = true;
  await run.stop();
  process.exit(code);
}
process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));

run.output.subscribe({
  next(result) {
    if (!result.success) return;
    // Architect emits success after files reach disk; console log messages do not.
    try {
      execFileSync(process.execPath, [resolve(scriptDirectory, 'apply-seo-metadata.mjs')], {
        cwd: root,
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('Static route generation failed:', error.message);
      void shutdown(1);
    }
  },
  error(error) {
    console.error(error.message);
    void shutdown(1);
  },
});
