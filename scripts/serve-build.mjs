// Internal smoke-test server. Also checks the build mounted at /freq/.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://test.invalid').pathname);
    if (path === '/freq') { res.writeHead(301, { Location: '/freq/' }); res.end(); return; }
    if (path.startsWith('/freq/')) path = path.slice(5);
    const file = resolve(root, `.${path.endsWith('/') ? `${path}index.html` : path}`);
    if (!file.startsWith(root + '/')) { res.writeHead(403); res.end(); return; }
    const bytes = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Vary': 'Origin', 'Cache-Control': 'no-cache' }); res.end(bytes);
  } catch { res.writeHead(404); res.end(); }
}).listen(4173, '127.0.0.1', () => console.log('Build smoke-test server listening on port 4173'));
