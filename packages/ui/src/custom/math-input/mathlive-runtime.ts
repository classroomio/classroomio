import { ComputeEngine } from '@cortex-js/compute-engine';
import type { MathJsonExpression } from '@cortex-js/compute-engine/math-json';
import 'mathlive';
import 'mathlive/fonts.css';
import type { MathKeyboardLayout } from './types';

const computeEngine = new ComputeEngine();
// The SSR build resolves mathlive's node entry, which has no MathfieldElement export; the browser entry registers it on window.
const { MathfieldElement } = window;

// MathLive resolves its fonts and sounds relative to its own script URL, which a bundled chunk breaks; fonts.css ships the fonts through the bundler instead.
MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;
MathfieldElement.computeEngine = computeEngine;

export function toMathJson(latex: string): MathJsonExpression {
  return computeEngine.parse(latex).json;
}

/** The virtual keyboard is one shared panel, so each field sets its layouts when it gains focus. */
export function useKeyboardLayouts(layouts: MathKeyboardLayout[]) {
  window.mathVirtualKeyboard.layouts = layouts;
}
