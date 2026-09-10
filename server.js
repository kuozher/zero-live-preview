const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 52330;
const HOST = '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.cjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const watchers = new Map();

function getWatcher(dirPath) {
  if (watchers.has(dirPath)) {
    return watchers.get(dirPath);
  }
  const entry = {
    clients: new Set(),
    timer: null,
    watcher: null
  };
  try {
    entry.watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
      // Ignore temporary/dependency noise
      if (filename && (filename.includes('node_modules') || filename.includes('.git') || filename.endsWith('.tmp') || filename.startsWith('.'))) {
        return;
      }
      if (entry.timer) clearTimeout(entry.timer);
      entry.timer = setTimeout(() => {
        const isCss = filename && filename.endsWith('.css');
        for (const res of entry.clients) {
          try {
            if (isCss) {
              res.write(`event: css\ndata: ${filename}\n\n`);
            } else {
              res.write(`data: reload\n\n`);
            }
          } catch (e) {}
        }
      }, 120);
    });
  } catch (err) {
    console.error('Watch error:', err.message);
  }
  watchers.set(dirPath, entry);
  return entry;
}

function removeClient(dirPath, res) {
  const entry = watchers.get(dirPath);
  if (!entry) return;
  entry.clients.delete(res);
  if (entry.clients.size === 0) {
    if (entry.timer) clearTimeout(entry.timer);
    if (entry.watcher) {
      try { entry.watcher.close(); } catch (e) {}
    }
    watchers.delete(dirPath);
  }
}

// Auto-shutdown after 2 hours of inactivity if no clients connected
let idleTimer = null;
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    let totalClients = 0;
    for (const entry of watchers.values()) {
      totalClients += entry.clients.size;
    }
    if (totalClients === 0) {
      process.exit(0);
    }
  }, 2 * 60 * 60 * 1000);
}
resetIdleTimer();

const server = http.createServer((req, res) => {
  resetIdleTimer();
  const reqUrl = new URL(req.url, `http://${HOST}:${PORT}`);

  // Ping endpoint
  if (reqUrl.pathname === '/__ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('pong');
  }

  // Stop endpoint
  if (reqUrl.pathname === '/__stop') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('stopping');
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 150);
    return;
  }

  // SSE endpoint for live reload
  if (reqUrl.pathname === '/__sse') {
    const targetParam = reqUrl.searchParams.get('target') || '';
    let targetPath = '';
    if (targetParam.startsWith('/raw/')) {
      targetPath = decodeURIComponent(targetParam.slice(5));
      if (/^\/[A-Za-z]:/.test(targetPath)) {
        targetPath = targetPath.slice(1);
      } else if (!/^[A-Za-z]:/.test(targetPath) && !targetPath.startsWith('/')) {
        targetPath = '/' + targetPath;
      }
      targetPath = path.normalize(targetPath);
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(': connected\n\n');

    let watchDir = '';
    try {
      if (targetPath && fs.existsSync(targetPath)) {
        const stat = fs.statSync(targetPath);
        watchDir = stat.isDirectory() ? targetPath : path.dirname(targetPath);
      }
    } catch (e) {}

    if (watchDir) {
      const entry = getWatcher(watchDir);
      entry.clients.add(res);
      req.on('close', () => removeClient(watchDir, res));
    }
    return;
  }

  // File serving: /raw/<drive>:/<path> or /raw/<posix_path>
  if (reqUrl.pathname.startsWith('/raw/')) {
    let rawPath = decodeURIComponent(reqUrl.pathname.slice(5));
    if (/^\/[A-Za-z]:/.test(rawPath)) {
      rawPath = rawPath.slice(1);
    } else if (!/^[A-Za-z]:/.test(rawPath) && !rawPath.startsWith('/')) {
      rawPath = '/' + rawPath;
    }
    const filePath = path.normalize(rawPath);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<h3>404 Not Found</h3><p>File not found: ${filePath}</p>`);
    }

    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (!reqUrl.pathname.endsWith('/')) {
          res.writeHead(301, { 'Location': reqUrl.pathname + '/' + (reqUrl.search || '') });
          return res.end();
        }
        const indexHtml = path.join(filePath, 'index.html');
        const indexHtm = path.join(filePath, 'index.htm');
        if (fs.existsSync(indexHtml)) {
          return serveFile(indexHtml, req, res);
        } else if (fs.existsSync(indexHtm)) {
          return serveFile(indexHtm, req, res);
        } else {
          // List directory
          const files = fs.readdirSync(filePath);
          const listHtml = `
            <!DOCTYPE html>
            <html>
            <head><title>Index of ${filePath}</title><style>body{font-family:sans-serif;padding:2rem;}a{display:block;margin:6px 0;}</style></head>
            <body>
              <h2>📁 Index of ${filePath}</h2>
              <hr/>
              ${files.map(f => {
                const full = path.join(filePath, f).replace(/\\/g, '/');
                return `<a href="/raw/${encodeURI(full)}">${f}</a>`;
              }).join('')}
            </body>
            </html>
          `;
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(listHtml);
        }
      }
      return serveFile(filePath, req, res);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end(`Internal Server Error: ${err.message}`);
    }
  }

  // Smart Referer fallback for root-relative paths (/images/foo.png etc.)
  const referer = req.headers.referer;
  if (referer) {
    try {
      const refUrl = new URL(referer);
      if (refUrl.pathname.startsWith('/raw/')) {
        let refRaw = decodeURIComponent(refUrl.pathname.slice(5));
        if (/^\/[A-Za-z]:/.test(refRaw)) refRaw = refRaw.slice(1);
        const refDir = path.dirname(path.normalize(refRaw));
        const subPath = decodeURIComponent(reqUrl.pathname);
        const candidate = path.join(refDir, subPath);
        if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
          return serveFile(candidate, req, res);
        }
      }
    } catch (e) {}
  }

  // Default fallback
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h3>Zed Universal Live Preview Server</h3><p>Status: Running</p>');
});

function serveFile(filePath, req, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  if (ext === '.html' || ext === '.htm') {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end(`Read Error: ${err.message}`);
      }
      const injectScript = `
<!-- __ZED_LIVE_PREVIEW_INJECT__ -->
<script>
(() => {
  try {
    const sseUrl = '/__sse?target=' + encodeURIComponent(location.pathname);
    const es = new EventSource(sseUrl);
    es.onmessage = (e) => {
      if (e.data === 'reload') {
        location.reload();
      }
    };
    es.addEventListener('css', () => {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      for (const link of links) {
        const u = new URL(link.href, location.origin);
        u.searchParams.set('_lp_t', Date.now());
        link.href = u.href;
      }
    });
  } catch (err) {
    console.warn('[LivePreview] SSE error:', err);
  }
})();
</script>
`;
      let content = data;
      if (content.includes('</body>')) {
        content = content.replace('</body>', injectScript + '</body>');
      } else {
        content += injectScript;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(content, 'utf-8'),
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
  } else {
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    stream.pipe(res);
  }
}

server.on('error', (err) => {
  console.error('[LivePreview Server Error]', err.message);
});

server.listen(PORT, HOST, () => {
  console.log(`Zed Universal Live Preview running on http://${HOST}:${PORT}`);
});
