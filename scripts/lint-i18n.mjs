#!/usr/bin/env node
/* Hint tool: print runs of English text inside html`` templates that are not wrapped in t(). Not exact. Usage: node scripts/lint-i18n.mjs rostra/src/file.js */
import { readFileSync } from 'node:fs';
for (const f of process.argv.slice(2)) {
  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/>([^<>${}`]*[A-Za-z]{3,}[^<>${}`]*)</g)) {
      const text = m[1].trim();
      if (text && !/^[\d\s.,:;%·–—-]+$/.test(text)) console.log(`${f}:${i + 1}: ${text.slice(0, 80)}`);
    }
    for (const m of line.matchAll(/(placeholder|aria-label|title|alt)="([^"]{3,})"/g)) console.log(`${f}:${i + 1}: [${m[1]}] ${m[2].slice(0, 80)}`);
  });
}
