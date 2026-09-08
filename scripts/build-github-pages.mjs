import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, cpSync, rmSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const prefix = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
if (prefix && !/^\/[A-Za-z0-9_.-]+$/.test(prefix)) throw new Error('Expected a single GitHub repository path.');
const result = spawnSync('pnpm', ['run', 'build'], { stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_BASE_PATH: prefix } });
if (result.status !== 0) process.exit(result.status || 1);
const root = resolve('dist/client');
// Vinext writes path-prefixed assets into a matching physical directory.
// Pages already mounts the artifact at that prefix, so flatten only that
// generated asset directory while retaining the prefixed URLs in the files.
if (prefix) {
 const nested = join(root, prefix.slice(1));
 if (existsSync(nested)) {
  for (const entry of readdirSync(nested)) cpSync(join(nested, entry), join(root, entry), { recursive: true });
  rmSync(nested, { recursive: true });
 }
}
if (!existsSync(join(root, 'index.html'))) throw new Error('Static export is missing index.html.');
const html = readFileSync(join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)) {
 const url = match[1];
 if (!/\.(?:js|css)$/.test(url) || !url.startsWith('/')) continue;
 if (prefix && !url.startsWith(prefix + '/')) throw new Error(`Asset is missing the repository prefix: ${url}`);
 if (!existsSync(join(root, url.slice(prefix.length).replace(/^\//, '')))) throw new Error(`Missing emitted asset: ${url}`);
}
console.log(`GitHub Pages artifact verified for ${prefix || '/'}.`);
