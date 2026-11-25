// Renders a motion-graphics project to transparent PNGs with headless Chromium.
// Usage:
//   node render.mjs <projectDir> stills <outDir> <t1> <t2> ...          stills at the design size, plus scenes.json
//   node render.mjs <projectDir> frames <outDir> <fromSec> <toSec> <scale> RGBA frames named by source frame number
//   node render.mjs <projectDir> scenes <out.json>                      the scene list (ids, in/out, behind ranges)
// SUBFRAMES=4 renders motion-blur sub-frames into <outDir>/sub for blur.py.
import { createRequire } from 'node:module';
import { mkdirSync, symlinkSync, existsSync, writeFileSync, readFileSync, readdirSync, createReadStream, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [projectArg, mode, outArg, ...rest] = process.argv.slice(2);
const projectDir = path.resolve(projectArg === '--check' ? '.' : projectArg);

/** Finds Playwright: $MG_PLAYWRIGHT, then node_modules (including pnpm's store) in the project or any parent of this skill. */
function loadPlaywright() {
  if (process.env.MG_PLAYWRIGHT) return createRequire(import.meta.url)(process.env.MG_PLAYWRIGHT);

  for (const start of [projectDir, here]) {
    let dir = start;
    while (dir !== path.dirname(dir)) {
      const direct = path.join(dir, 'node_modules', 'playwright');
      if (existsSync(direct)) return createRequire(import.meta.url)(direct);

      const store = path.join(dir, 'node_modules', '.pnpm');
      if (existsSync(store)) {
        const match = readdirSync(store).filter((name) => name.startsWith('playwright@')).sort().pop();
        if (match) return createRequire(import.meta.url)(path.join(store, match, 'node_modules', 'playwright'));
      }
      dir = path.dirname(dir);
    }
  }
  throw new Error('Playwright not found. Run `npm i -D playwright && npx playwright install chromium` in the project, or set MG_PLAYWRIGHT.');
}

const { chromium } = loadPlaywright();
if (projectArg === '--check') {
  const browser = await chromium.launch();
  await browser.close();
  console.log('playwright ok');
  process.exit(0);
}

const project = JSON.parse(readFileSync(path.join(projectDir, 'motion.json'), 'utf8'));
const FPS = project.fps;
const TOTAL_FRAMES = project.frames;
const SUBFRAMES = Number(process.env.SUBFRAMES || 1);
const SHUTTER = Number(process.env.SHUTTER || 0.5);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  const file = path.join(projectDir, relative);
  if (!file.startsWith(projectDir) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404);
    response.end();
    return;
  }

  response.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

const scale = mode === 'frames' ? Number(rest[2] || 1) : 1;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: project.width, height: project.height }, deviceScaleFactor: scale });
page.on('pageerror', (error) => console.error('page error:', error.message));
await page.goto(`http://127.0.0.1:${port}/index.html`);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.assetsReady);
await page.waitForTimeout(200);

const sceneList = () => page.evaluate(() => window.sceneList());

if (mode === 'scenes') {
  writeFileSync(path.resolve(outArg), JSON.stringify(await sceneList(), null, 2));
} else if (mode === 'stills') {
  const outDir = path.resolve(outArg);
  mkdirSync(outDir, { recursive: true });
  for (const value of rest) {
    const time = Number(value);
    await page.evaluate((t) => window.prepareAt(t), time);
    await page.evaluate((t) => window.renderAt(t), time);
    await page.screenshot({ path: path.join(outDir, `still_${time.toFixed(2)}.png`), omitBackground: true });
  }
  writeFileSync(path.join(outDir, 'scenes.json'), JSON.stringify(await sceneList(), null, 2));
} else if (mode === 'frames') {
  const outDir = path.resolve(outArg);
  mkdirSync(outDir, { recursive: true });
  const fromFrame = Math.max(0, Math.floor(Number(rest[0]) * FPS));
  const toFrame = Math.min(TOTAL_FRAMES, Math.ceil(Number(rest[1]) * FPS));
  const blank = path.join(outDir, 'blank.png');
  if (!existsSync(blank)) {
    await page.evaluate(() => window.renderAt(-10));
    await page.screenshot({ path: blank, omitBackground: true });
  }

  const activeFrames = [];
  const started = Date.now();
  for (let frame = fromFrame; frame < toFrame; frame += 1) {
    const time = frame / FPS;
    const file = path.join(outDir, `f_${String(frame).padStart(5, '0')}.png`);
    await page.evaluate((t) => window.prepareAt(t), time);
    let active = await page.evaluate((t) => window.renderAt(t), time);
    if (SUBFRAMES > 1) {
      for (const offset of [-0.25 / FPS, 0.25 / FPS]) active += await page.evaluate((t) => window.renderAt(t), time + offset);
    }
    if (active === 0) {
      if (!existsSync(file)) symlinkSync('blank.png', file);
      continue;
    }

    activeFrames.push(frame);
    if (SUBFRAMES > 1) {
      mkdirSync(path.join(outDir, 'sub'), { recursive: true });
      for (let k = 0; k < SUBFRAMES; k += 1) {
        const offset = ((k - (SUBFRAMES - 1) / 2) * (SHUTTER / SUBFRAMES)) / FPS;
        await page.evaluate((t) => window.renderAt(t), time + offset);
        await page.screenshot({ path: path.join(outDir, 'sub', `f_${String(frame).padStart(5, '0')}_${k}.png`), omitBackground: true });
      }
    } else {
      await page.screenshot({ path: file, omitBackground: true });
    }
    if (activeFrames.length % 100 === 0) {
      const seconds = ((Date.now() - started) / 1000).toFixed(0);
      console.log(`frame ${frame} (${activeFrames.length} drawn, ${seconds}s)`);
    }
  }
  writeFileSync(path.join(outDir, `active_${fromFrame}_${toFrame}.json`), JSON.stringify(activeFrames));
  writeFileSync(path.join(outDir, 'scenes.json'), JSON.stringify(await sceneList(), null, 2));
} else {
  console.error(`unknown mode: ${mode}`);
  process.exitCode = 1;
}

await browser.close();
server.close();
