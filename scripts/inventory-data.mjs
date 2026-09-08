import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
const root = fileURLToPath(new URL('../public/data/', import.meta.url));
async function collect(directory) {
 const entries = await readdir(directory, { withFileTypes: true });
 const files = [];
 for (const entry of entries) {
  if (entry.name.startsWith('.')) continue;
  const path = join(directory, entry.name);
  if (entry.isDirectory()) files.push(...await collect(path));
  else if (entry.isFile()) {
   const bytes = await readFile(path);
   files.push({ path: relative(root, path).split('\\').join('/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
 }
 return files;
}
const files = (await collect(root)).sort((a, b) => a.path.localeCompare(b.path, 'en'));
await writeFile(new URL('../data/assets.json', import.meta.url), JSON.stringify({ publicRoot: 'public/data', files }, null, 2) + '\n');
console.log(`Indexed ${files.length} assets in data/assets.json.`);
