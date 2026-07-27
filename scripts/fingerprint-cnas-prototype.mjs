import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SELF = 'scripts/fingerprint-cnas-prototype.mjs';
const entries = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolute);
      continue;
    }
    const path = relative(ROOT, absolute).replaceAll('\\', '/');
    if (path === SELF || path === 'html_design/prototype-audit.json' || path.startsWith('design/.validate-')) continue;
    entries.push({ path, sha256: createHash('sha256').update(await readFile(absolute)).digest('hex') });
  }
}

for (const directory of ['design', 'html_design', 'scripts']) await walk(join(ROOT, directory));
entries.sort((a, b) => a.path.localeCompare(b.path));
const fingerprint = createHash('sha256').update(JSON.stringify(entries)).digest('hex');
console.log(JSON.stringify({ algorithm: 'sha256(JSON.stringify(sorted[{path,sha256}]))', files: entries.length, fingerprint }, null, 2));
