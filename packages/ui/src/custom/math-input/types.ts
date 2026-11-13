import type { MathJsonExpression } from '@cortex-js/compute-engine/math-json';
import type { VirtualKeyboardLayout, VirtualKeyboardName } from 'mathlive';

export interface MathInputValue {
  latex: string;
  mathjson: MathJsonExpression;
}

export type MathKeyboardPreset = 'numeric' | 'algebra' | 'calculus' | 'greek' | 'sets' | 'full';

/** A built-in MathLive layout name or a custom MathLive layout definition. */
export type MathKeyboardLayout = VirtualKeyboardName | VirtualKeyboardLayout;

/** A preset name, or the exact list of layouts the virtual keyboard should offer. */
export type MathKeyboard = MathKeyboardPreset | MathKeyboardLayout[];

export type MathLevel = 'primary' | 'secondary' | 'advanced';

export type MathStructureId =
  | 'fraction'
  | 'mixed_number'
  | 'parentheses'
  | 'power'
  | 'subscript'
  | 'square_root'
  | 'nth_root'
  | 'absolute_value'
  | 'system'
  | 'matrix'
  | 'piecewise'
  | 'integral'
  | 'sum'
  | 'limit'
  | 'derivative';

export interface MathStructure {
  id: MathStructureId;
  /** MathLive insert template: `#@` takes the selection or the term before the caret, `#0` the selection, `#?` a placeholder. */
  insert: string;
  preview: string;
  level: MathLevel;
}

export type MathStructureLabels = Record<MathStructureId, string>;
