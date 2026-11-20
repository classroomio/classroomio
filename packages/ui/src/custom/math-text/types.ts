import { DEFAULT_MATH_STRUCTURE_LABELS } from '../math-input/structures';
import type { MathStructureLabels } from '../math-input/types';

export interface MathEditLabels {
  insertMath: string;
  typeTab: string;
  latexTab: string;
  mathFieldLabel: string;
  paletteLabel: string;
  structures: MathStructureLabels;
  latexLabel: string;
  previewLabel: string;
  previewEmpty: string;
  done: string;
  cancel: string;
}

export const DEFAULT_MATH_EDIT_LABELS: MathEditLabels = {
  insertMath: 'Insert math',
  typeTab: 'Type',
  latexTab: 'LaTeX',
  mathFieldLabel: 'Math',
  paletteLabel: 'Math structures',
  structures: DEFAULT_MATH_STRUCTURE_LABELS,
  latexLabel: 'LaTeX',
  previewLabel: 'Preview',
  previewEmpty: 'Type LaTeX to see a preview',
  done: 'Done',
  cancel: 'Cancel'
};
