import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '..', '..', 'test', 'fixtures', 'sources');
const logPath = join(here, '.spike-commits.jsonl');

const CONTENT_PORT = 3002;
const VENDOR_PORT = 3003;
const SCORM_AGAIN_VERSION = '3.4.6';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const fixtures = {
  'scorm12-minimal': { version: '1.2', launch: 'sco.html' },
  'scorm2004-minimal': { version: '2004', launch: 'sco.html' },
  'scorm2004-three-modules': {
    version: '2004',
    launch: 'module1.html',
    modules: ['module1.html', 'module2.html', 'module3-quiz.html']
  },
  'scorm12-quiz-mastery': { version: '1.2', launch: 'quiz.html' },
  'streamed-launcher': { version: '2004', launch: 'launcher.html' }
};

/** Appends one stub commit to the JSONL log. Resolves once flushed. */
export function recordCommit(entry) {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(logPath, { flags: 'a' });
    stream.on('error', reject);
    stream.on('close', resolve);
    stream.end(JSON.stringify(entry) + '\n');
  });
}

function playerPage(fixtureName, fixture) {
  const is12 = fixture.version === '1.2';
  const apiImport = is12 ? 'scorm12.js' : 'scorm2004.js';
  const modules = fixture.modules ?? [fixture.launch];
  const menu =
    modules.length > 1
      ? `<nav>${modules.map((m) => `<button type="button" data-module="${m}">${m}</button>`).join('')}</nav>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Spike player: ${fixtureName}</title>
<style>body{font-family:sans-serif;margin:1rem}iframe{width:100%;height:480px;border:1px solid #999}#log{white-space:pre-wrap;border:1px solid #999;padding:.5rem;min-height:6rem}</style>
</head>
<body>
<h1>Spike player: ${fixtureName} (scorm-again ${SCORM_AGAIN_VERSION})</h1>
${menu}
<iframe id="sco" title="Package content"></iframe>
<h2>Commits</h2>
<div id="log" aria-live="polite"></div>
<script type="module">
import { ${is12 ? 'Scorm12API' : 'Scorm2004API'} } from 'https://cdn.jsdelivr.net/npm/scorm-again@${SCORM_AGAIN_VERSION}/dist/esm/${apiImport}';
const fixture = ${JSON.stringify(fixture.launch)};
const logEl = document.getElementById('log');
const frame = document.getElementById('sco');
let seq = 0;
function log(msg) { logEl.textContent += msg + '\\n'; }
const api = new ${is12 ? 'Scorm12API' : 'Scorm2004API'}({
  autocommit: true,
  autocommitSeconds: 30,
  lmsCommitUrl: '/stub/commit',
  sendFullCommit: false,
  includeCommitSequence: true,
  selfReportSessionTime: false,
  logLevel: 2
});
api.loadFromJSON({});
if (${JSON.stringify(is12)}) { window.API = api; } else { window.API_1484_11 = api; }
api.on(${JSON.stringify(is12 ? 'LMSCommit' : 'Commit')}, () => log('commit event, seq=' + seq));
function launch(path) {
  frame.src = '/files/${fixtureName}/' + path;
  log('launched ' + path);
}
document.querySelectorAll('[data-module]').forEach((btn) => {
  btn.onclick = () => {
    try { ${is12 ? "api.LMSCommit(''); api.LMSFinish('');" : "api.Commit(''); api.Terminate('');"} } catch (e) { log('swap commit threw: ' + e.message); }
    log('swapped after final commit');
    launch(btn.dataset.module);
  };
});
window.addEventListener('pagehide', () => {
  try {
    const payload = JSON.stringify({ seq: ++seq, beacon: true, cmi: api.cmi });
    navigator.sendBeacon('/stub/commit', payload);
  } catch (e) { /* page is going away; nothing to report to */ }
});
launch(fixture);
log('player ready, API exposed as ${is12 ? 'window.API' : 'window.API_1484_11'}');
</script>
</body>
</html>`;
}

function send(res, status, body, type = 'text/html; charset=utf-8') {
  res.writeHead(status, { 'content-type': type });
  res.end(body);
}

function contentServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/') {
      const links = Object.keys(fixtures)
        .map((name) => `<li><a href="/play?fixture=${name}">${name}</a></li>`)
        .join('');
      send(
        res,
        200,
        `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Spike player</title></head><body><h1>Spike player (throwaway)</h1><ul>${links}</ul><p><a href="/stub/commits">commit log</a></p></body></html>`
      );
      return;
    }

    if (req.method === 'GET' && url.pathname === '/play') {
      const name = url.searchParams.get('fixture') ?? '';
      const fixture = fixtures[name];

      if (!fixture) {
        send(res, 404, 'unknown fixture');
        return;
      }

      send(res, 200, playerPage(name, fixture));
      return;
    }

    if (url.pathname.startsWith('/files/')) {
      const relative = normalize(url.pathname.slice('/files/'.length)).split(sep).join('/');
      const filePath = join(fixturesDir, relative);

      if (!filePath.startsWith(fixturesDir) || !existsSync(filePath)) {
        send(res, 404, 'not found', 'text/plain; charset=utf-8');
        return;
      }

      res.writeHead(200, { 'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream' });
      createReadStream(filePath).pipe(res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/stub/commit') {
      let body = '';
      for await (const chunk of req) body += chunk;
      await recordCommit({ at: new Date().toISOString(), bytes: body.length, body: body.slice(0, 2000) });
      send(res, 200, JSON.stringify({ result: true, errorCode: 0 }), 'application/json; charset=utf-8');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/stub/commits') {
      if (!existsSync(logPath)) {
        send(res, 200, '[]', 'application/json; charset=utf-8');
        return;
      }
      const raw = await readFile(logPath, 'utf8');
      send(
        res,
        200,
        JSON.stringify(
          raw
            .trim()
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line))
        ),
        'application/json; charset=utf-8'
      );
      return;
    }

    send(res, 404, 'not found', 'text/plain; charset=utf-8');
  });
}

function vendorServer() {
  return createServer((req, res) => {
    if (req.url !== '/vendor-page.html') {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Vendor content</title></head><body><h1>Vendor content (second origin)</h1><button id="done" type="button">Finish streamed lesson</button><script>document.getElementById('done').onclick = function () { parent.postMessage({ type: 'scorm-set', element: 'cmi.completion_status', value: 'completed' }, '*'); parent.postMessage({ type: 'scorm-commit' }, '*'); parent.postMessage({ type: 'scorm-finish', exit: 'normal' }, '*'); };</scr` +
        `ipt></body></html>`
    );
  });
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  // Browsers resolve *.localhost to loopback, so content.localhost:3002 reaches this listener.
  contentServer().listen(CONTENT_PORT, '127.0.0.1', () => {
    console.log(`content origin: http://content.localhost:${CONTENT_PORT}`);
  });
  vendorServer().listen(VENDOR_PORT, '127.0.0.1', () => {
    console.log(`vendor origin: http://127.0.0.1:${VENDOR_PORT}/vendor-page.html`);
  });
}
