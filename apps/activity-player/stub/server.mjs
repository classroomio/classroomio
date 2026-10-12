import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream, createWriteStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = join(here, '..');
const distDir = join(appDir, 'dist');
const fixturesDir = join(appDir, '..', '..', 'packages', 'activity-packages', 'test', 'fixtures', 'sources');
const logPath = join(here, '.stub-commits.jsonl');

const PORT = Number(process.env.ACTIVITY_PLAYER_STUB_PORT ?? 3004);
const CONTENT_TOKEN = 'stub-content';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const fixtures = {
  'scorm12-minimal': { format: 'scorm12', launch: 'sco.html' },
  'scorm2004-minimal': { format: 'scorm2004', launch: 'sco.html' },
  'scorm12-quiz-mastery': { format: 'scorm12', launch: 'quiz.html' },
  'scorm2004-three-modules': {
    format: 'scorm2004',
    launch: 'module1.html',
    modules: ['module1.html', 'module2.html', 'module3-quiz.html']
  }
};

function launchForToken(token) {
  const match = /^stub-(.+?)(?:--(.+))?$/.exec(token);

  if (!match) {
    return null;
  }

  const fixture = fixtures[match[1]];

  if (!fixture) {
    return null;
  }

  const launch = match[2] ?? fixture.launch;

  if (fixture.modules && !fixture.modules.includes(launch)) {
    return null;
  }

  if (!fixture.modules && launch !== fixture.launch) {
    return null;
  }

  return { name: match[1], format: fixture.format, launch };
}

function send(res, status, body, type = 'text/plain; charset=utf-8', headers = {}) {
  res.writeHead(status, { 'content-type': type, ...headers });
  res.end(body);
}

function recordCommit(entry) {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(logPath, { flags: 'a' });
    stream.on('error', reject);
    stream.on('close', resolve);
    stream.end(JSON.stringify(entry) + '\n');
  });
}

function harnessPage(origin) {
  const cards = Object.entries(fixtures)
    .map(([name, fixture]) => {
      const modules = fixture.modules ?? [fixture.launch];
      const links = modules
        .map((module) => {
          const token = module === fixture.launch ? `stub-${name}` : `stub-${name}--${module}`;
          return `<li><button type="button" data-token="${token}">${module}</button></li>`;
        })
        .join('');

      return `<section><h2>${name} (${fixture.format})</h2><ul>${links}</ul></section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Activity player stub harness</title>
<style>body{font-family:sans-serif;margin:1rem}iframe{width:100%;height:560px;border:1px solid #999}#events{white-space:pre-wrap;border:1px solid #999;padding:.5rem;min-height:4rem}</style>
</head>
<body>
<h1>Activity player stub harness</h1>
${cards}
<h2>Player</h2>
<iframe id="player" title="Activity player"></iframe>
<h2>Player events</h2>
<div id="events" aria-live="polite"></div>
<p><a href="/stub/commits">commit log</a></p>
<script>
var frame = document.getElementById('player');
var events = document.getElementById('events');
var origin = ${JSON.stringify(origin)};
document.querySelectorAll('[data-token]').forEach(function (btn) {
  btn.onclick = function () {
    events.textContent += 'launch ' + btn.dataset.token + '\\n';
    frame.src = '/activity/player/' + btn.dataset.token;
  };
});
window.addEventListener('message', function (event) {
  if (event.origin !== origin) return;
  if (event.source !== frame.contentWindow) return;
  events.textContent += JSON.stringify(event.data) + '\\n';
});
</script>
</body>
</html>`;
}

function serveDistFile(res, requestPath) {
  const filePath = join(distDir, normalize(requestPath).split(sep).join('/'));

  if (!filePath.startsWith(distDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    send(res, 404, 'not found');
    return;
  }

  const immutable = requestPath.startsWith('/assets/');
  res.writeHead(200, {
    'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    ...(immutable ? { 'cache-control': 'public, max-age=604800, immutable' } : { 'cache-control': 'no-store' })
  });
  createReadStream(filePath).pipe(res);
}

function serveFixtureFile(res, requestPath, range) {
  const filePath = join(fixturesDir, normalize(requestPath).split(sep).join('/'));

  if (!filePath.startsWith(fixturesDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    send(res, 404, 'not found');
    return;
  }

  const size = statSync(filePath).size;
  const type = contentTypes[extname(filePath)] ?? 'application/octet-stream';

  if (!range) {
    res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': size });
    createReadStream(filePath).pipe(res);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);

  if (!match) {
    send(res, 416, 'range not satisfiable');
    return;
  }

  const start = match[1] === '' ? Math.max(size - Number(match[2]), 0) : Number(match[1]);
  const end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);

  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start >= size) {
    send(res, 416, 'range not satisfiable');
    return;
  }

  res.writeHead(206, {
    'content-type': type,
    'accept-ranges': 'bytes',
    'content-range': `bytes ${start}-${end}/${size}`,
    'content-length': end - start + 1
  });
  createReadStream(filePath, { start, end }).pipe(res);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const host = req.headers.host ?? `content.localhost:${PORT}`;
  const origin = `http://${host}`;

  if (req.method === 'GET' && url.pathname === '/') {
    send(res, 200, harnessPage(origin), 'text/html; charset=utf-8');
    return;
  }

  const playerMatch = /^\/activity\/player\/([^/]+)$/.exec(url.pathname);

  if (req.method === 'GET' && playerMatch) {
    if (!launchForToken(playerMatch[1])) {
      send(res, 404, 'unknown launch token');
      return;
    }

    if (!existsSync(join(distDir, 'index.html'))) {
      send(res, 503, 'player is not built yet: run pnpm --filter @cio/activity-player build first');
      return;
    }

    serveDistFile(res, '/index.html');
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/activity/player-assets/')) {
    serveDistFile(res, url.pathname.slice('/activity/player-assets'.length) || '/');
    return;
  }

  const contentMatch = /^\/activity\/content\/([^/]+)\/(.*)$/.exec(url.pathname);

  if (req.method === 'GET' && contentMatch) {
    if (contentMatch[1] !== CONTENT_TOKEN) {
      send(res, 401, 'invalid content token');
      return;
    }

    serveFixtureFile(res, decodeURIComponent(contentMatch[2]), req.headers.range);
    return;
  }

  const stateMatch = /^\/activity\/scorm\/runtime\/([^/]+)\/state$/.exec(url.pathname);

  if (req.method === 'GET' && stateMatch) {
    const launch = launchForToken(stateMatch[1]);

    if (!launch) {
      send(res, 404, 'unknown launch token');
      return;
    }

    send(
      res,
      200,
      JSON.stringify({
        format: launch.format,
        cmi: {},
        contentToken: CONTENT_TOKEN,
        launchPath: `${launch.name}/${launch.launch}`,
        parentOrigin: origin,
        debug: url.searchParams.get('debug') === '1'
      }),
      'application/json; charset=utf-8'
    );
    return;
  }

  const commitMatch = /^\/activity\/scorm\/runtime\/([^/]+)\/commit$/.exec(url.pathname);

  if (req.method === 'POST' && commitMatch) {
    if (!launchForToken(commitMatch[1])) {
      send(res, 404, 'unknown launch token');
      return;
    }

    let body = '';
    for await (const chunk of req) body += chunk;
    await recordCommit({
      at: new Date().toISOString(),
      token: commitMatch[1],
      contentType: req.headers['content-type'] ?? null,
      bytes: body.length,
      body: body.slice(0, 2000)
    });
    send(res, 200, JSON.stringify({ result: true, errorCode: 0 }), 'application/json; charset=utf-8');
    return;
  }

  const eventMatch = /^\/activity\/scorm\/runtime\/([^/]+)\/event$/.exec(url.pathname);

  if (req.method === 'POST' && eventMatch) {
    if (!launchForToken(eventMatch[1])) {
      send(res, 404, 'unknown launch token');
      return;
    }

    let body = '';
    for await (const chunk of req) body += chunk;
    await recordCommit({
      at: new Date().toISOString(),
      token: eventMatch[1],
      contentType: req.headers['content-type'] ?? null,
      bytes: body.length,
      body: body.slice(0, 2000)
    });
    send(res, 200, JSON.stringify({ result: true, errorCode: 0, recorded: true }), 'application/json; charset=utf-8');
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

  send(res, 404, 'not found');
});

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  server.listen(PORT, () => {
    console.log(`stub content origin: http://content.localhost:${PORT}`);
  });
}

export default server;
