import type { MathImagePayload } from './math-image';

export const MATH_IMAGE_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MATH_IMAGE_MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_UPLOAD_SIDE = 1600;
const JPEG_QUALITY = 0.9;

/** A rectangle as fractions (0 to 1) of an image's width and height. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function pickImageFile(files: Iterable<File> | null | undefined): File | null {
  for (const file of files ?? []) {
    if (file.type.startsWith('image/')) return file;
  }

  return null;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = url;
  });
}

function canvasToPayload(canvas: HTMLCanvasElement, mediaType: MathImagePayload['mediaType']): MathImagePayload {
  const url = canvas.toDataURL(mediaType, JPEG_QUALITY);

  return { mediaType, data: url.slice(url.indexOf(',') + 1) };
}

/** Crops (when given a rectangle), downsizes to at most 1600px on the long side and encodes the image as JPEG. */
export function imageToPayload(image: HTMLImageElement, crop: CropRect | null): MathImagePayload {
  const source = crop ?? { x: 0, y: 0, width: 1, height: 1 };
  const sourceX = Math.round(source.x * image.naturalWidth);
  const sourceY = Math.round(source.y * image.naturalHeight);
  const sourceWidth = Math.max(1, Math.round(source.width * image.naturalWidth));
  const sourceHeight = Math.max(1, Math.round(source.height * image.naturalHeight));
  const scale = Math.min(1, MAX_UPLOAD_SIDE / Math.max(sourceWidth, sourceHeight));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

  return canvasToPayload(canvas, 'image/jpeg');
}

export function drawingToPayload(canvas: HTMLCanvasElement): MathImagePayload {
  return canvasToPayload(canvas, 'image/png');
}

export function normaliseCrop(startX: number, startY: number, endX: number, endY: number): CropRect {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const x1 = clamp(Math.min(startX, endX));
  const y1 = clamp(Math.min(startY, endY));
  const x2 = clamp(Math.max(startX, endX));
  const y2 = clamp(Math.max(startY, endY));

  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

let pendingEngine: Promise<typeof import('@cio/question-types/math-engine')> | null = null;

/** Whether the Compute Engine can parse the LaTeX; the engine is loaded on first use. */
export async function isParsableMath(latex: string): Promise<boolean> {
  pendingEngine ??= import('@cio/question-types/math-engine');
  const engine = await pendingEngine;

  return engine.parseMath(latex) !== null;
}
