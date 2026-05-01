#!/usr/bin/env node
/**
 * Pure-Node port of the GitHub Actions validation logic. Run locally
 * before pushing to catch failures faster:
 *
 *   npm run validate
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const errors = [];

function tagBalance(c, name) {
  const open = (c.match(new RegExp(`<${name}\\b`, 'g')) || []).length;
  const close = (c.match(new RegExp(`</${name}>`, 'g')) || []).length;
  return open === close ? null : `<${name}> ${open} ≠ ${close}`;
}

async function main() {
  const entries = await readdir(ROOT);
  const html = entries.filter((f) => f.endsWith('.html'));
  const assets = new Set(entries);
  for (const sub of ['assets', 'splash']) {
    try {
      const sub_entries = await readdir(join(ROOT, sub));
      sub_entries.forEach((a) => assets.add(`${sub}/${a}`));
    } catch {}
  }

  for (const f of html) {
    const c = await readFile(join(ROOT, f), 'utf8');
    for (const tag of ['script', 'style', 'picture', 'form']) {
      const err = tagBalance(c, tag);
      if (err) errors.push(`${f}: ${err}`);
    }
    for (const m of c.matchAll(/<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/g)) {
      try { JSON.parse(m[1]); }
      catch (e) { errors.push(`${f}: invalid JSON-LD: ${e.message}`); }
    }
    if (c.includes('href="#"')) errors.push(`${f}: has dead href="#"`);

    for (const m of c.matchAll(/(?:href|src|srcset)="([^"]+)"/g)) {
      const raw = m[1];
      if (raw.includes('${') || raw.includes('{{')) continue;
      const url = raw.split('#')[0].split('?')[0].trim();
      if (!url || /^(https?:|mailto:|tel:|data:|\/)/.test(url)) continue;
      for (const piece of url.split(',')) {
        const cand = piece.trim().split(' ')[0];
        if (!cand) continue;
        if (!assets.has(cand) && !html.includes(cand)) {
          errors.push(`${f}: missing internal target "${cand}"`);
        }
      }
    }
  }

  // JSON validity
  try { JSON.parse(await readFile(join(ROOT, 'manifest.webmanifest'), 'utf8')); }
  catch (e) { errors.push(`manifest.webmanifest: ${e.message}`); }

  if (errors.length) {
    console.error('\n✗ Validation failed:');
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log('✓ HTML balanced, JSON-LD valid, internal links resolve, no dead href="#".');
}

main().catch((e) => { console.error(e); process.exit(1); });
