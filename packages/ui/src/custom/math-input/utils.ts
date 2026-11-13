import { MATH_KEYBOARD_PRESETS } from './keyboards';
import { MATH_LEVELS, MATH_STRUCTURES } from './structures';
import type { MathKeyboard, MathKeyboardLayout, MathLevel, MathStructure } from './types';

const LATEX_TEXT_ESCAPES: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}'
};
const LATEX_SPECIAL_CHARACTERS = /[\\{}$&#^_%~]/g;

export function resolveMathKeyboard(keyboard: MathKeyboard): MathKeyboardLayout[] {
  return typeof keyboard === 'string' ? MATH_KEYBOARD_PRESETS[keyboard] : keyboard;
}

/** Structures taught up to and including `level`, in palette order. */
export function getMathStructures(level: MathLevel): MathStructure[] {
  const maxLevelIndex = MATH_LEVELS.indexOf(level);

  return MATH_STRUCTURES.filter((structure) => MATH_LEVELS.indexOf(structure.level) <= maxLevelIndex);
}

/** Wraps plain text in `\text{}` so a mathfield shows it upright, as written. */
export function textToLatex(text: string): string {
  if (!text) return '';

  const escapedText = text.replace(LATEX_SPECIAL_CHARACTERS, (char) => LATEX_TEXT_ESCAPES[char] ?? `\\${char}`);

  return `\\text{${escapedText}}`;
}
