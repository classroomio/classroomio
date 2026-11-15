import { MATH_REQUIRED_FORMS, type MathCompare, type MathCompareMode } from '@cio/question-types';
import type { MathKeyboardPreset } from '../../../math-input/types';

export { MATH_REQUIRED_FORMS };

let pendingGrading: Promise<typeof import('@cio/question-types/math-grading')> | null = null;

/** Loads the Compute Engine grader on first use, so pages without a math question never download it. */
export function loadMathGrading() {
  pendingGrading ??= import('@cio/question-types/math-grading');

  return pendingGrading;
}

export const MATH_COMPARE_MODES: readonly MathCompareMode[] = ['equivalent', 'exact_form', 'numeric', 'set'];

export const MATH_KEYBOARD_PRESET_KEYS: readonly MathKeyboardPreset[] = [
  'numeric',
  'algebra',
  'calculus',
  'greek',
  'sets',
  'full'
];

export function readMathKeyboardPreset(settings: Record<string, unknown> | undefined): MathKeyboardPreset {
  const keyboard = settings?.keyboard;

  return MATH_KEYBOARD_PRESET_KEYS.includes(keyboard as MathKeyboardPreset)
    ? (keyboard as MathKeyboardPreset)
    : 'algebra';
}

/** Switches a compare setting to `mode`, keeping a form or tolerance that still applies. */
export function changeCompareMode(current: MathCompare, mode: MathCompareMode): MathCompare {
  if (mode === current.mode) return current;
  if (mode === 'exact_form') return { mode, form: 'simplified' };
  if (mode === 'numeric') return { mode, relativeTolerance: 0.01 };

  return { mode };
}
