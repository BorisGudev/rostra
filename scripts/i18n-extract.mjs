#!/usr/bin/env node
/* Collect every t('...') and t`...` key from rostra/src/*.js into rostra/src/i18n/keys.json, and report which
   keys have no Bulgarian translation in rostra/src/i18n-bg.js. Run: node scripts/i18n-extract.mjs [--check] */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { SCRIPTS } from './build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'rostra', 'src');
const keys = new Map(); // key -> [files]

function unescapeJs(s) { return s.replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n'); }
function add(k, file) { if (!k.trim()) return; const list = keys.get(k) || []; if (!list.includes(file)) list.push(file); keys.set(k, list); }

for (const f of SCRIPTS) {
  if (f.startsWith('i18n')) continue;
  let src;
  try { src = readFileSync(path.join(SRC, f), 'utf8'); } catch (e) { continue; }
  /* t('...') and t("...") */
  for (const m of src.matchAll(/\bt\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1\s*\)/g)) add(unescapeJs(m[2]), f);
  /* t`...${x}...` : interpolations become {0}, {1}, ... */
  for (const m of src.matchAll(/\bt`((?:\\.|[^`\\])*)`/g)) {
    let i = 0, depth = 0, out = '', body = m[1];
    for (let p = 0; p < body.length; p++) {
      if (body[p] === '$' && body[p + 1] === '{' && depth === 0) { out += '{' + i++ + '}'; depth = 1; p++; continue; }
      if (depth) { if (body[p] === '{') depth++; else if (body[p] === '}') { depth--; } continue; }
      out += body[p];
    }
    add(unescapeJs(out), f);
  }
}

const sorted = [...keys.keys()].sort((a, b) => a.localeCompare(b));
mkdirSync(path.join(SRC, 'i18n'), { recursive: true });
writeFileSync(path.join(SRC, 'i18n', 'keys.json'), JSON.stringify(Object.fromEntries(sorted.map((k) => [k, keys.get(k)])), null, 1) + '\n');

/* Coverage against the Bulgarian dictionary. */
let bg = {};
try {
  const ctx = { I18N: { dict: {} } };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(path.join(SRC, 'i18n-bg.js'), 'utf8'), ctx);
  bg = ctx.I18N.dict.bg || {};
} catch (e) { bg = {}; }
const missing = sorted.filter((k) => !bg[k]);
const stale = Object.keys(bg).filter((k) => !keys.has(k));
console.log(`${sorted.length} keys; ${sorted.length - missing.length} translated to Bulgarian (${Math.round(((sorted.length - missing.length) / Math.max(1, sorted.length)) * 100)}%); ${stale.length} stale entries`);
if (process.argv.includes('--check') && missing.length) { console.log('missing:'); missing.slice(0, 40).forEach((k) => console.log('  ' + JSON.stringify(k))); }
if (process.argv.includes('--missing-json')) writeFileSync(path.join(SRC, 'i18n', 'missing.json'), JSON.stringify(missing, null, 1) + '\n');
