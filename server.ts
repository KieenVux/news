import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

import { fetchUsers } from './scripts/fetch-users.js';

const rootDir = resolve('.');
const port = Number(process.env.PORT || 3000);

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
};

function sendJson(res: import('node:http').ServerResponse, statusCode: number, body: unknown) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body, null, 2));
}

function getFilePath(urlPath: string) {
  const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const requested = safePath === '/' ? 'index.html' : safePath.replace(/^[/\\]/, '');
  return join(rootDir, requested);
}

async function serveFile(
  filePath: string,
  res: import('node:http').ServerResponse,
) {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      return serveFile(join(filePath, 'index.html'), res);
    }

    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Length': fileStat.size,
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
    });
    createReadStream(filePath).pipe(res);
  } catch {
    sendJson(res, 404, { error: 'Not found' });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (url.pathname === '/api/users' && req.method === 'GET') {
    try {
      const users = await fetchUsers();
      sendJson(res, 200, { count: users.length, users });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  const filePath = getFilePath(url.pathname);
  try {
    await access(filePath);
    await serveFile(filePath, res);
  } catch {
    sendJson(res, 404, { error: 'Not found' });
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
