const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const envFilePath = path.join(rootDir, '.env');

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  });

  return env;
}

const envValues = { ...process.env, ...parseEnvFile(envFilePath) };

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/api/config') {
    sendJson(res, 200, {
      SUPABASE_URL: envValues.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: envValues.SUPABASE_ANON_KEY || '',
    });
    return;
  }

  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const requestedPath = path.resolve(rootDir, `.${pathname}`);
  const isInsideRoot = requestedPath.startsWith(rootDir);

  if (!isInsideRoot) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.stat(requestedPath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendFile(res, path.join(rootDir, 'index.html'));
      return;
    }

    sendFile(res, requestedPath);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
