/* The six headless suites written for the app (rostra/tests/*.test.js) run here on Node, each in a child
   process so promise draining works (see run-legacy.mjs). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const runner = path.join(path.dirname(fileURLToPath(import.meta.url)), 'run-legacy.mjs');
for (const name of ['art', 'content', 'gym', 'persist', 'visual', 'viva']) {
  test(`legacy suite: ${name}`, () => {
    const r = spawnSync(process.execPath, [runner, name], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /\d+ ok, 0 failed/);
  });
}
