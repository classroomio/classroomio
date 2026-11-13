import type { MathLevel, MathStructure, MathStructureLabels } from './types';

export const MATH_LEVELS: MathLevel[] = ['primary', 'secondary', 'advanced'];

export const MATH_STRUCTURES: MathStructure[] = [
  { id: 'fraction', insert: '\\frac{#@}{#?}', preview: '\\frac{a}{b}', level: 'primary' },
  { id: 'mixed_number', insert: '#?\\frac{#?}{#?}', preview: '1\\tfrac{1}{2}', level: 'primary' },
  { id: 'parentheses', insert: '\\left(#0\\right)', preview: '(x)', level: 'primary' },
  { id: 'power', insert: '#@^{#?}', preview: 'x^{n}', level: 'secondary' },
  { id: 'subscript', insert: '#@_{#?}', preview: 'x_{n}', level: 'secondary' },
  { id: 'square_root', insert: '\\sqrt{#0}', preview: '\\sqrt{x}', level: 'secondary' },
  { id: 'nth_root', insert: '\\sqrt[#?]{#0}', preview: '\\sqrt[n]{x}', level: 'secondary' },
  { id: 'absolute_value', insert: '\\left|#0\\right|', preview: '|x|', level: 'secondary' },
  {
    id: 'system',
    insert: '\\begin{cases}#0\\\\#?\\end{cases}',
    preview: '\\begin{cases}a\\\\b\\end{cases}',
    level: 'secondary'
  },
  {
    id: 'matrix',
    insert: '\\begin{pmatrix}#0 & #?\\\\#? & #?\\end{pmatrix}',
    preview: '\\begin{pmatrix}a & b\\\\c & d\\end{pmatrix}',
    level: 'advanced'
  },
  {
    id: 'piecewise',
    insert: '\\begin{cases}#? & #?\\\\#? & #?\\end{cases}',
    preview: '\\begin{cases}a & x<0\\\\b & x\\ge 0\\end{cases}',
    level: 'advanced'
  },
  { id: 'integral', insert: '\\int_{#?}^{#?}#0\\,dx', preview: '\\int_{a}^{b}', level: 'advanced' },
  { id: 'sum', insert: '\\sum_{#?}^{#?}#0', preview: '\\sum_{i=1}^{n}', level: 'advanced' },
  { id: 'limit', insert: '\\lim_{#?\\to #?}#0', preview: '\\lim_{x\\to a}', level: 'advanced' },
  { id: 'derivative', insert: '\\frac{d}{dx}#0', preview: '\\frac{d}{dx}', level: 'advanced' }
];

export const DEFAULT_MATH_STRUCTURE_LABELS: MathStructureLabels = {
  fraction: 'Fraction',
  mixed_number: 'Mixed number',
  parentheses: 'Brackets',
  power: 'Power',
  subscript: 'Subscript',
  square_root: 'Square root',
  nth_root: 'nth root',
  absolute_value: 'Absolute value',
  system: 'System of equations',
  matrix: 'Matrix',
  piecewise: 'Piecewise function',
  integral: 'Integral',
  sum: 'Sum',
  limit: 'Limit',
  derivative: 'Derivative'
};
