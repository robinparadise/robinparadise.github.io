#!/usr/bin/env node
/**
 * i18n for Firebase Hosting.
 *
 *   node tools/i18n.mjs          sync localized/en/ from the root, then check
 *   node tools/i18n.mjs --check  check only, do not write
 *
 * English is the source of truth: `index.html` and `404.html` at the repo root.
 * This script mirrors them into `localized/en/` with absolute asset paths, and
 * verifies that `localized/es/` still has the exact same markup skeleton.
 *
 * Firebase Hosting reads `i18n.root` from firebase.json and picks the folder
 * from the Accept-Language header (override: `firebase-language-override`).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const pages = ['index.html', '404.html'];
const checkOnly = process.argv.includes('--check');

const read = (p) => readFile(path.join(root, p), 'utf8');

/** local asset references must be absolute: the pages live in subfolders now */
function absolute(html) {
  return html.replace(/\b(href|src)="(?!https?:|\/|#|mailto:|data:)([^"]+)"/g, '$1="/$2"');
}

/** tag sequence, attributes and text stripped: same skeleton = same page */
function skeleton(html) {
  const bare = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  return [...bare.matchAll(/<\/?([a-z][a-z0-9-]*)/gi)].map((m) => m[0].toLowerCase().replace(/\s.*/, ''));
}

function firstDiff(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) {
      const near = (list) => list.slice(Math.max(0, i - 4), i + 5).join(' ');
      return { at: i, en: near(a), es: near(b) };
    }
  }
  return null;
}

let failed = false;

for (const page of pages) {
  const source = await read(page);
  const mirror = { dir: 'localized/en', html: absolute(source) };

  if (!checkOnly) {
    await mkdir(path.join(root, mirror.dir), { recursive: true });
    await writeFile(path.join(root, mirror.dir, page), mirror.html);
    console.log(`wrote ${mirror.dir}/${page}`);
  }

  const esPath = path.join(root, 'localized/es', page);
  let es;
  try {
    es = await readFile(esPath, 'utf8');
  } catch {
    console.log(`skip ${page}: localized/es/${page} does not exist yet`);
    continue;
  }

  const diff = firstDiff(skeleton(mirror.html), skeleton(es));
  if (diff) {
    failed = true;
    console.error(`\n${page}: es skeleton drifted from en at tag #${diff.at}`);
    console.error(`  en: …${diff.en}…`);
    console.error(`  es: …${diff.es}…`);
  } else {
    console.log(`ok ${page}: es mirrors en (${skeleton(es).length} tags)`);
  }
}

if (failed) {
  console.error('\nes is out of sync — fix the markup, then run again.');
  process.exit(1);
}
