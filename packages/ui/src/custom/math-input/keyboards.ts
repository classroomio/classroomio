import type { VirtualKeyboardLayout } from 'mathlive';
import type { MathKeyboardLayout, MathKeyboardPreset } from './types';

const NUMERIC_LAYOUT: VirtualKeyboardLayout = {
  id: 'cio-numeric',
  label: '123',
  rows: [
    ['[7]', '[8]', '[9]', '[/]', { class: 'small', latex: '\\frac{#@}{#?}' }, '[backspace]'],
    ['[4]', '[5]', '[6]', '[*]', '#@^{#?}', '\\sqrt{#0}'],
    ['[1]', '[2]', '[3]', '[-]', '[(]', '[)]'],
    ['[0]', '[.]', '\\%', '[+]', '[left]', '[right]']
  ]
};

const CALCULUS_LAYOUT: VirtualKeyboardLayout = {
  id: 'cio-calculus',
  label: '∫ dx',
  rows: [
    [
      { class: 'small', latex: '\\int_{#?}^{#?}#0\\,dx' },
      '\\int',
      { class: 'small', latex: '\\frac{d}{dx}#0' },
      { class: 'small', latex: '\\frac{\\partial}{\\partial #?}#0' },
      { class: 'small', latex: '\\lim_{#?\\to #?}#0' },
      '\\infty'
    ],
    [
      { class: 'small', latex: '\\sum_{#?}^{#?}#0' },
      { class: 'small', latex: '\\prod_{#?}^{#?}#0' },
      '\\ln',
      '\\log',
      { class: 'small', latex: '\\log_{#?}#0' },
      'e^{#?}'
    ],
    ['\\sin', '\\cos', '\\tan', { class: 'small', latex: '\\sin^{-1}' }, '\\pi', '\\theta'],
    ["f'", "f''", 'dx', 'dy', '[left]', '[right]']
  ]
};

const SETS_LAYOUT: VirtualKeyboardLayout = {
  id: 'cio-sets',
  label: '∈ ∪',
  rows: [
    ['\\in', '\\notin', '\\subset', '\\subseteq', '\\cup', '\\cap'],
    ['\\setminus', '\\emptyset', '\\lbrace #0 \\rbrace', '\\mid', '\\forall', '\\exists'],
    ['\\mathbb{N}', '\\mathbb{Z}', '\\mathbb{Q}', '\\mathbb{R}', '\\mathbb{C}', '\\infty'],
    ['\\left[#?, #?\\right]', '\\left(#?, #?\\right)', '\\le', '\\ge', '[left]', '[right]']
  ]
};

export const MATH_KEYBOARD_PRESETS: Record<MathKeyboardPreset, MathKeyboardLayout[]> = {
  numeric: [NUMERIC_LAYOUT],
  algebra: ['numeric', 'symbols', 'alphabetic'],
  calculus: [CALCULUS_LAYOUT, 'numeric', 'symbols', 'alphabetic'],
  greek: ['numeric', 'greek', 'symbols'],
  sets: [SETS_LAYOUT, 'numeric', 'alphabetic'],
  full: ['numeric', 'symbols', CALCULUS_LAYOUT, SETS_LAYOUT, 'alphabetic', 'greek']
};
