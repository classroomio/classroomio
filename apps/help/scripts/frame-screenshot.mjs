/**
 * Frames a help-center screenshot in the ClassroomIO browser board: browser
 * chrome, rounded board, shelf and feet. The board is 840 units wide and hugs
 * the screenshot's height, so any aspect ratio fits without cropping.
 *
 * Usage:
 *   pnpm --filter @cio/help frame-screenshot <input> <output.webp|png>
 *     [--url app.classroomio.com] [--max-width 1600]
 *
 * The screenshot keeps its own pixels. The whole frame is shrunk to
 * --max-width only when it is wider than that (never enlarged). The background
 * is transparent.
 */
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const INK = '#17140F';
const PAPER = '#FDFBF7';
const BONE_300 = '#E3DACA';
const STROKE = 1.2;

const BOARD_WIDTH = 840;
const BOARD_RADIUS = 14;
const CHROME_HEIGHT = 40;
const SHELF_OVERHANG = 30;
const SHELF_HEIGHT = 17;
const FOOT_INSET = 33;
const FOOT_LENGTH = 19;
const FOOT_DROP = 18;
const PAD_X = 40;
const PAD_TOP = 8;
const PAD_BOTTOM = 16;

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: 'string', default: 'app.classroomio.com' },
    'max-width': { type: 'string', default: '1600' }
  }
});

const [inputPath, outputPath] = positionals;
if (!inputPath || !outputPath) {
  console.error('Usage: frame-screenshot <input> <output.webp|png> [--url] [--max-width]');
  process.exit(1);
}

const screenshot = sharp(await readFile(inputPath));
const { width: screenshotWidth, height: screenshotHeight } = await screenshot.metadata();
if (!screenshotWidth || !screenshotHeight) {
  console.error('Could not read the screenshot dimensions');
  process.exit(1);
}

const frame = buildFrame({
  screenshotWidth,
  screenshotHeight,
  url: escapeXml(options.url)
});
const chrome = await sharp(Buffer.from(frame.svg)).ensureAlpha().png().toBuffer();
const chromeMeta = await sharp(chrome).metadata();
if (chromeMeta.width !== frame.viewWidth || chromeMeta.height !== frame.viewHeight) {
  throw new Error(
    `Frame raster is ${chromeMeta.width}x${chromeMeta.height}, expected ${frame.viewWidth}x${frame.viewHeight}`
  );
}

const clippedScreenshot = await clipScreenshot(screenshot, frame.contentWidth, frame.contentHeight, frame.radius);
const framed = sharp(chrome).composite([
  {
    input: clippedScreenshot,
    left: frame.contentLeft,
    top: frame.contentTop,
    blend: 'dest-over'
  }
]);
const maxWidth = Number(options['max-width']);
const sized = frame.viewWidth > maxWidth ? framed.resize({ width: maxWidth, withoutEnlargement: true }) : framed;
const encoded = extname(outputPath).toLowerCase() === '.png' ? sized.png() : sized.webp({ lossless: true });
const { width, height, size } = await encoded.toFile(outputPath);

console.log(`[help] Framed ${inputPath} -> ${outputPath} (${width}x${height}, ${Math.round(size / 1024)} KB)`);

/**
 * @param {{ screenshotWidth: number, screenshotHeight: number, url: string }} board
 * @returns {{ svg: string, viewWidth: number, viewHeight: number, contentLeft: number, contentTop: number, contentWidth: number, contentHeight: number, radius: number }}
 */
function buildFrame({ screenshotWidth, screenshotHeight, url }) {
  const pixelsPerUnit = screenshotWidth / BOARD_WIDTH;
  const padX = toPixels(PAD_X, pixelsPerUnit);
  const padTop = toPixels(PAD_TOP, pixelsPerUnit);
  const padBottom = toPixels(PAD_BOTTOM, pixelsPerUnit);
  const chromeHeight = toPixels(CHROME_HEIGHT, pixelsPerUnit);
  const boardRadius = toPixels(BOARD_RADIUS, pixelsPerUnit);
  const shelfOverhang = toPixels(SHELF_OVERHANG, pixelsPerUnit);
  const shelfHeight = toPixels(SHELF_HEIGHT, pixelsPerUnit);
  const footInset = toPixels(FOOT_INSET, pixelsPerUnit);
  const footLength = toPixels(FOOT_LENGTH, pixelsPerUnit);
  const footDrop = toPixels(FOOT_DROP, pixelsPerUnit);
  const stroke = (STROKE * pixelsPerUnit).toFixed(2);
  const fontSize = (11 * pixelsPerUnit).toFixed(2);
  const shelfGap = Math.max(1, toPixels(1, pixelsPerUnit));
  const shelfRadius = Math.max(1, toPixels(2, pixelsPerUnit));

  const boardLeft = padX;
  const boardTop = padTop;
  const boardWidth = screenshotWidth;
  const boardHeight = chromeHeight + screenshotHeight;
  const contentLeft = boardLeft;
  const contentTop = boardTop + chromeHeight;
  const contentWidth = screenshotWidth;
  const contentHeight = screenshotHeight;
  const radius = Math.min(boardRadius, contentWidth / 2, contentHeight / 2);
  const shelfTop = boardTop + boardHeight + shelfGap;
  const footTop = shelfTop + shelfHeight;
  const footBottom = footTop + footDrop;
  const viewWidth = padX + boardWidth + padX;
  const viewHeight = footBottom + padBottom;
  const rightFootLeft = boardLeft + boardWidth - footInset;
  const hole = bottomRoundedRect(contentLeft, contentTop, contentWidth, contentHeight, radius);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewWidth}" height="${viewHeight}" viewBox="0 0 ${viewWidth} ${viewHeight}">
  <defs>
    <mask id="content-hole">
      <rect width="${viewWidth}" height="${viewHeight}" fill="#ffffff"/>
      <path d="${hole}" fill="#000000"/>
    </mask>
  </defs>
  <g mask="url(#content-hole)">
    <rect x="${boardLeft}" y="${boardTop}" width="${boardWidth}" height="${boardHeight}" rx="${boardRadius}" fill="${PAPER}"/>
  </g>
  <path d="M${boardLeft} ${contentTop}H${boardLeft + boardWidth}" stroke="${INK}" stroke-width="${stroke}"/>
  <circle cx="${boardLeft + toPixels(21, pixelsPerUnit)}" cy="${boardTop + toPixels(20, pixelsPerUnit)}" r="${toPixels(5.5, pixelsPerUnit)}" fill="none" stroke="${INK}" stroke-width="${stroke}"/>
  <circle cx="${boardLeft + toPixels(40, pixelsPerUnit)}" cy="${boardTop + toPixels(20, pixelsPerUnit)}" r="${toPixels(5.5, pixelsPerUnit)}" fill="none" stroke="${INK}" stroke-width="${stroke}"/>
  <circle cx="${boardLeft + toPixels(59, pixelsPerUnit)}" cy="${boardTop + toPixels(20, pixelsPerUnit)}" r="${toPixels(5.5, pixelsPerUnit)}" fill="none" stroke="${INK}" stroke-width="${stroke}"/>
  <rect x="${boardLeft + toPixels(86, pixelsPerUnit)}" y="${boardTop + toPixels(9, pixelsPerUnit)}" width="${toPixels(381, pixelsPerUnit)}" height="${toPixels(22, pixelsPerUnit)}" rx="${toPixels(5, pixelsPerUnit)}" fill="${PAPER}" stroke="${BONE_300}" stroke-width="${stroke}"/>
  <text x="${boardLeft + toPixels(98, pixelsPerUnit)}" y="${boardTop + toPixels(24, pixelsPerUnit)}" fill="${INK}" font-family="Menlo, 'SF Mono', ui-monospace, monospace" font-size="${fontSize}">${url}</text>
  <rect x="${boardLeft}" y="${boardTop}" width="${boardWidth}" height="${boardHeight}" rx="${boardRadius}" fill="none" stroke="${INK}" stroke-width="${stroke}"/>
  <rect x="${boardLeft - shelfOverhang}" y="${shelfTop}" width="${boardWidth + shelfOverhang * 2}" height="${shelfHeight}" rx="${shelfRadius}" fill="${BONE_300}" stroke="${INK}" stroke-width="${stroke}"/>
  <path d="M${boardLeft + footInset} ${footTop}V${footBottom}H${boardLeft + footInset + footLength}" fill="none" stroke="${INK}" stroke-width="${stroke}"/>
  <path d="M${rightFootLeft} ${footTop}V${footBottom}H${rightFootLeft - footLength}" fill="none" stroke="${INK}" stroke-width="${stroke}"/>
</svg>`;

  return { svg, viewWidth, viewHeight, contentLeft, contentTop, contentWidth, contentHeight, radius };
}

/**
 * @param {import('sharp').Sharp} screenshot
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @returns {Promise<Buffer>}
 */
async function clipScreenshot(screenshot, width, height, radius) {
  const path = bottomRoundedRect(0, 0, width, height, radius);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path fill="#ffffff" d="${path}"/></svg>`
  );

  return screenshot
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @returns {string}
 */
function bottomRoundedRect(x, y, width, height, radius) {
  const right = x + width;
  const bottom = y + height;

  return `M${x} ${y}H${right}V${bottom - radius}A${radius} ${radius} 0 0 1 ${right - radius} ${bottom}H${x + radius}A${radius} ${radius} 0 0 1 ${x} ${bottom - radius}Z`;
}

/**
 * @param {number} units
 * @param {number} pixelsPerUnit
 * @returns {number}
 */
function toPixels(units, pixelsPerUnit) {
  return Math.round(units * pixelsPerUnit);
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
