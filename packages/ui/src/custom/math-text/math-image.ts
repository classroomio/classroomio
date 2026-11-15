import { getContext, setContext } from 'svelte';

export type MathImageSource = 'photo' | 'draw';

export interface MathImagePayload {
  mediaType: 'image/png' | 'image/jpeg';
  /** Base64 without the data URL prefix. */
  data: string;
}

export interface MathImageConversion {
  latex: string;
  valid: boolean;
  /** Set when the engine could not read the converted LaTeX; `latex` still holds the model's attempt. */
  parseError?: string;
}

export interface MathImageLabels {
  fromImage: string;
  photoTab: string;
  drawTab: string;
  upload: string;
  takePhoto: string;
  photoHint: string;
  cropHint: string;
  resetCrop: string;
  convert: string;
  converting: string;
  drawHint: string;
  clear: string;
  original: string;
  converted: string;
  insert: string;
  noMathFound: string;
  parseFailed: string;
  invalidMath: string;
  unsupportedFile: string;
  imageTooLarge: string;
  conversionFailed: string;
}

export const DEFAULT_MATH_IMAGE_LABELS: MathImageLabels = {
  fromImage: 'Photo or draw',
  photoTab: 'Photo',
  drawTab: 'Draw',
  upload: 'Upload an image',
  takePhoto: 'Take a photo',
  photoHint: 'Paste a screenshot, drop an image or upload one.',
  cropHint: 'Drag a box around the math you want.',
  resetCrop: 'Use the whole image',
  convert: 'Convert',
  converting: 'Reading the math…',
  drawHint: 'Write the math here with your finger, a stylus or the mouse.',
  clear: 'Clear',
  original: 'Original',
  converted: 'Converted math',
  insert: 'Insert',
  noMathFound: 'No math was found in this image.',
  parseFailed: 'This could not be read as valid math. Fix it below or try again.',
  invalidMath: 'This is not valid math yet.',
  unsupportedFile: 'Use a PNG, JPEG or WebP image.',
  imageTooLarge: 'This image is too large.',
  conversionFailed: 'The conversion failed. Try again.'
};

export interface MathImageConverter {
  labels: MathImageLabels;
  /** Resolves with the converted math; rejects with an Error whose message can be shown to the user. */
  convert: (image: MathImagePayload, source: MathImageSource) => Promise<MathImageConversion>;
}

const MATH_IMAGE_CONVERTER_KEY = Symbol('math-image-converter');

/** Makes the Photo and Draw tabs available to every math box below the calling component. */
export function setMathImageConverter(converter: MathImageConverter) {
  setContext(MATH_IMAGE_CONVERTER_KEY, converter);
}

export function getMathImageConverter(): MathImageConverter | undefined {
  return getContext<MathImageConverter | undefined>(MATH_IMAGE_CONVERTER_KEY);
}
