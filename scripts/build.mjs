#!/usr/bin/env node
/**
 * EOD & RC build pipeline
 * --------------------------------------------------------------
 * Reads source files from the repo root, minifies HTML / CSS / JS,
 * copies binary assets verbatim, and writes the result to ./dist/.
 *
 * Source files are NOT modified. Pure local-only build artefact.
 *
 * Usage:
 *   npm run build           # quiet
 *   npm run build:report    # print before/after sizes
 */
import { readFile, writeFile, mkdir, copyFile, readdir, stat, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';
import { minify as minifyCss } from 'csso';

const ROOT = resolve(process.cwd());
const DIST = resolve(ROOT, 'dist');
const REPORT = process.argv.includes('--report');

const HTML_OPTIONS = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
  decodeEntities: false,
  sortAttributes: false,
  sortClassName: false,
  // Keep <pre>, <textarea> formatting intact
  preserveLineBreaks: false,
};

// Files / patterns that the build should not output
const SKIP = new Set([
  'package.json',
  'package-lock.json',
  '.gitignore',
  '.editorconfig',
  '.gitattributes',
  'README.md',
  'CONTRIBUTING.md',
  '.git',
  'node_modules',
  'dist',
  'scripts',
  '.github',
]);

const stats = { html: [], css: [], js: [], copied: 0, totalBefore: 0, totalAfter: 0 };

async function walk(dir, base = ROOT) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const abs = join(dir, entry.name);
    const rel = relative(base, abs);
    if (entry.isDirectory()) {
      out.push(...(await walk(abs, base)));
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

async function ensureDir(path) {
  await mkdir(dirname(path), { recursive: true });
}

async function processFile(rel) {
  const src = join(ROOT, rel);
  const dst = join(DIST, rel);
  await ensureDir(dst);

  const before = (await stat(src)).size;
  stats.totalBefore += before;

  if (rel.endsWith('.html')) {
    const input = await readFile(src, 'utf8');
    const out = await minifyHtml(input, HTML_OPTIONS);
    await writeFile(dst, out, 'utf8');
    stats.html.push({ rel, before, after: Buffer.byteLength(out) });
    stats.totalAfter += Buffer.byteLength(out);
  } else if (rel.endsWith('.css')) {
    const input = await readFile(src, 'utf8');
    const out = minifyCss(input).css;
    await writeFile(dst, out, 'utf8');
    stats.css.push({ rel, before, after: Buffer.byteLength(out) });
    stats.totalAfter += Buffer.byteLength(out);
  } else if (rel.endsWith('.js')) {
    const input = await readFile(src, 'utf8');
    const out = await minifyJs(input, {
      compress: { passes: 2 },
      mangle: true,
      format: { comments: false },
    });
    const code = out.code ?? input;
    await writeFile(dst, code, 'utf8');
    stats.js.push({ rel, before, after: Buffer.byteLength(code) });
    stats.totalAfter += Buffer.byteLength(code);
  } else {
    // Binary or other: copy verbatim
    await copyFile(src, dst);
    stats.copied += 1;
    stats.totalAfter += before;
  }
}

function fmt(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function pct(before, after) {
  if (!before) return '0%';
  return `${Math.round(((before - after) / before) * 100)}%`;
}

function printReport() {
  if (!REPORT) return;
  const sections = [
    ['HTML', stats.html],
    ['CSS', stats.css],
    ['JS', stats.js],
  ];
  for (const [label, arr] of sections) {
    if (!arr.length) continue;
    console.log(`\n${label}:`);
    for (const r of arr) {
      console.log(`  ${r.rel.padEnd(46)} ${fmt(r.before).padStart(10)} → ${fmt(r.after).padStart(10)}  (-${pct(r.before, r.after)})`);
    }
  }
  console.log(`\nBinary copied verbatim: ${stats.copied} files`);
  console.log(`\nTOTAL: ${fmt(stats.totalBefore)} → ${fmt(stats.totalAfter)}  (-${pct(stats.totalBefore, stats.totalAfter)})\n`);
}

async function main() {
  if (existsSync(DIST)) {
    await rm(DIST, { recursive: true, force: true });
  }
  await mkdir(DIST, { recursive: true });

  const files = await walk(ROOT);
  console.log(`Building ${files.length} files → dist/`);

  for (const rel of files) {
    try {
      await processFile(rel);
    } catch (e) {
      console.error(`FAIL ${rel}: ${e.message}`);
      process.exit(1);
    }
  }

  printReport();
  console.log(`✓ Build complete: ${stats.html.length} HTML, ${stats.css.length} CSS, ${stats.js.length} JS, ${stats.copied} binary`);
  console.log(`  Saved ${fmt(stats.totalBefore - stats.totalAfter)} (${pct(stats.totalBefore, stats.totalAfter)})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
