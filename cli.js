const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 52330;
const HOST = '127.0.0.1';
const DEBUG_LOG = path.join(__dirname, 'debug.log');

function logDebug(message, extra = null) {
  try {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}` + (extra !== null ? ` | ${typeof extra === 'object' ? JSON.stringify(extra) : extra}` : '') + '\n';
    fs.appendFileSync(DEBUG_LOG, line, 'utf-8');
  } catch (e) {}
}

function ping() {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${PORT}/__ping`, { timeout: 300 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${PORT}/__stop`, { timeout: 500 }, () => {
      resolve();
    });
    req.on('error', () => resolve());
    req.on('timeout', () => {
      req.destroy();
      resolve();
    });
  });
}

async function ensureServerRunning() {
  const isRunning = await ping();
  if (isRunning) return true;

  const serverScript = path.join(__dirname, 'server.js');

  if (process.platform === 'win32') {
    const vbsScript = path.join(__dirname, 'run-hidden.vbs');
    const child = spawn('wscript.exe', [vbsScript, serverScript], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
  } else {
    // macOS / Linux: spawn node in background with detached: true
    const child = spawn(process.execPath, [serverScript], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
  }

  // Wait up to 1.5s for server to respond
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (await ping()) return true;
  }
  return false;
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', `start "" "${url}"`], {
      windowsVerbatimArguments: true,
      detached: true,
      stdio: 'ignore'
    }).unref();
  } else if (process.platform === 'darwin') {
    // macOS
    spawn('open', [url], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  } else {
    // Linux / BSD
    spawn('xdg-open', [url], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  }
}

function encodePathForUrl(normPath) {
  // Splits path by '/' and encodes individual segments with encodeURIComponent,
  // preventing URL special characters (#, ?, &, %, +, spaces) from corrupting the URL
  const segments = normPath.split('/');
  return segments.map((seg, idx) => {
    // Keep Windows drive letter intact e.g. 'C:'
    if (idx === 0 && /^[A-Za-z]:$/.test(seg)) {
      return seg;
    }
    return encodeURIComponent(seg);
  }).join('/');
}

async function main() {
  const rawArgs = process.argv.slice(2);
  logDebug('CLI invoked', { argv: process.argv, cwd: process.cwd(), platform: process.platform });

  if (rawArgs.includes('--stop')) {
    logDebug('Stop requested');
    await stopServer();
    process.exit(0);
  }

  // Support paths with unescaped spaces by joining all arguments
  let rawInput = rawArgs.join(' ').trim();

  // Strip possible surrounding quotes or escaped quotes
  rawInput = rawInput.replace(/^["']|["']$/g, '').trim();
  rawInput = rawInput.replace(/^\\"|\\"$/g, '').trim();

  if (!rawInput || rawInput === '$ZED_FILE') {
    logDebug('Error: No valid file specified', { rawInput, rawArgs });
    console.error('No valid file specified. (Please make sure an active editor file is open in Zed)');
    process.exit(1);
  }

  const ok = await ensureServerRunning();
  if (!ok) {
    logDebug('Error: Server failed to start');
    console.error('Failed to start Live Preview server.');
    process.exit(1);
  }

  const absPath = path.resolve(rawInput);
  let norm = absPath.replace(/\\/g, '/');
  // Strip leading slash before drive letter on Windows e.g. /C:/foo -> C:/foo
  if (/^\/[A-Za-z]:/.test(norm)) norm = norm.slice(1);
  // On POSIX, strip leading '/' so '/raw/' prefix behaves uniformly
  if (norm.startsWith('/')) norm = norm.slice(1);

  const encodedPath = encodePathForUrl(norm);
  const targetUrl = `http://${HOST}:${PORT}/raw/${encodedPath}`;
  logDebug('Opening preview URL', {
    rawInput,
    absPath,
    exists: fs.existsSync(absPath),
    targetUrl
  });

  openBrowser(targetUrl);
  process.exit(0);
}

main().catch((err) => {
  logDebug('Fatal error in main', { message: err.message, stack: err.stack });
  console.error(err);
  process.exit(1);
});
