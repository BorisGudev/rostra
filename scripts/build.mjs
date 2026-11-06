#!/usr/bin/env node
/* Build Rostra into dist/.
   - Concatenates rostra/src/*.css and rostra/src/*.js in a fixed order (one global scope, by design: see NOTES.md).
   - Copies React, ReactDOM, htm and supabase-js from node_modules into dist/vendor (nothing loads from a CDN).
   - Copies the two typefaces (plus a Cyrillic companion) from node_modules into dist/fonts.
   - Writes dist/index.html with hashed asset names.
   Run: node scripts/build.mjs            (or: npm run build) */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const SRC = path.join(ROOT, 'rostra', 'src');
const PUBLIC = path.join(ROOT, 'rostra', 'public');
const DIST = path.join(ROOT, 'dist');
const NM = path.join(ROOT, 'node_modules');

/* Load order matters: top-level code may only use names defined in earlier files. */
export const SCRIPTS = ['i18n.js', 'i18n-bg.js', 'data.js', 'platform.js', 'engine.js', 'ui.js', 'kit.js', 'art.js', 'pages-core.js', 'pages-more.js', 'viva.js', 'speech.js', 'gym.js', 'auth.js', 'teacher.js', 'app.js'];
export const STYLES = ['fonts.css', 'styles.css', 'kit.css', 'art.css', 'viva.css', 'gym.css', 'auth.css', 'polish.css'];

const read = (f) => readFileSync(path.join(SRC, f), 'utf8');
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 10);
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

export function build({ out = DIST, quiet = false } = {}) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(path.join(out, 'assets'), { recursive: true });
  mkdirSync(path.join(out, 'vendor'), { recursive: true });
  mkdirSync(path.join(out, 'fonts'), { recursive: true });

  const css = STYLES.filter((f) => existsSync(path.join(SRC, f))).map(read).join('\n');
  const js = SCRIPTS.filter((f) => existsSync(path.join(SRC, f))).map((f) => `/* ---- ${f} ---- */\n${read(f)}`).join('\n');
  if (/<\/script/i.test(js)) throw new Error('inline script must not contain a closing script tag');
  const cssName = `app.${hash(css)}.css`, jsName = `app.${hash(js)}.js`;
  writeFileSync(path.join(out, 'assets', cssName), css);
  writeFileSync(path.join(out, 'assets', jsName), js);

  const vendor = [
    ['react/umd/react.production.min.js', 'react.js'],
    ['react-dom/umd/react-dom.production.min.js', 'react-dom.js'],
    ['htm/dist/htm.umd.js', 'htm.js'],
    ['@supabase/supabase-js/dist/umd/supabase.js', 'supabase.js'],
  ];
  for (const [from, to] of vendor) cpSync(path.join(NM, from), path.join(out, 'vendor', to));

  const fonts = [
    '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2',
    '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-standard-normal.woff2',
    '@fontsource-variable/onest/files/onest-cyrillic-wght-normal.woff2',
    '@fontsource-variable/onest/files/onest-cyrillic-ext-wght-normal.woff2',
    '@fontsource-variable/onest/files/onest-latin-wght-normal.woff2',
    '@fontsource/gfs-didot/files/gfs-didot-greek-400-normal.woff2',
    '@fontsource/gfs-didot/files/gfs-didot-greek-ext-400-normal.woff2',
    '@fontsource/gfs-didot/files/gfs-didot-latin-400-normal.woff2',
  ];
  for (const f of fonts) cpSync(path.join(NM, f), path.join(out, 'fonts', path.basename(f)));

  if (existsSync(PUBLIC)) cpSync(PUBLIC, out, { recursive: true });

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Rostra · Speak better</title>
<meta name="description" content="Rostra rehearses you for oral exams with an AI examiner and gives feedback on speeches, built on ethos, pathos and logos.">
<meta name="theme-color" content="#EDE9DF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#090C1F" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preload" href="/fonts/bricolage-grotesque-latin-standard-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/${cssName}">
<script>window.ROSTRA_VERSION=${JSON.stringify(pkg.version)};</script>
</head>
<body>
<div id="root"></div>
<noscript><p style="font:16px system-ui;padding:24px">Rostra needs JavaScript turned on.</p></noscript>
<script src="/vendor/react.js"></script>
<script src="/vendor/react-dom.js"></script>
<script src="/vendor/htm.js"></script>
<script src="/vendor/supabase.js"></script>
<script src="/assets/${jsName}"></script>
</body>
</html>
`;
  writeFileSync(path.join(out, 'index.html'), html);
  const size = readdirSync(path.join(out, 'assets')).reduce((s, f) => s + readFileSync(path.join(out, 'assets', f)).length, 0);
  if (!quiet) console.log(`dist/: ${jsName} + ${cssName} (${(size / 1024).toFixed(0)} KB), ${vendor.length} vendor files, ${fonts.length} fonts`);
  return { cssName, jsName };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build();
