import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

async function filesAt(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await filesAt(join(dir, entry.name), `${relative}/`));
    else if (entry.name !== 'sw.js') files.push(`./${relative}`);
  }
  return files.sort();
}
const files = await filesAt('dist');
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(join('dist', file)));
const version = hash.digest('hex').slice(0, 12);
await writeFile('dist/sw.js', `
const PREFIX = 'freq-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = PREFIX + '${version}';
const ASSETS = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    // Only our own same-origin build assets are cached. Some static servers
    // set Vary: Origin; module requests then differ from install requests.
    const cached = await cache.match(event.request, { ignoreVary: true });
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') return cache.match(new URL('./index.html', self.registration.scope), { ignoreVary: true });
      throw error;
    }
  }));
});
`);
console.log(`Offline cache: ${files.length} files, version ${version}`);
