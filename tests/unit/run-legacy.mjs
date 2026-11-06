/* Runs one or more legacy suites at top-level script scope (not inside a test callback), because
   drainMicrotasks() can only flush promises when no microtask is already running.
   Usage: node tests/unit/run-legacy.mjs art viva ...   Exit code = number of failures. */
import path from 'node:path';
import { makeContext, runSuite, ROOT } from './harness.mjs';

const names = process.argv.slice(2);
let fails = 0;
/* ES module evaluation itself runs inside a microtask, where V8 refuses to run a nested microtask checkpoint.
   setImmediate moves the suites to a plain macrotask, where process._tickCallback() can drain promises. */
setImmediate(() => {
for (const name of names) {
  const ctx = makeContext();
  const r = runSuite(ctx, [path.join(ROOT, 'rostra/tests/core.test.js'), path.join(ROOT, 'rostra/tests/' + name + '.test.js')]);
  fails += r.fails;
  const failed = r.lines.filter((l) => l.startsWith('FAIL'));
  console.log(`${name}: ${r.lines.length - 1 - failed.length} ok, ${failed.length} failed`);
  if (failed.length) console.log(failed.join('\n'));
}
process.exit(fails ? 1 : 0);
});
