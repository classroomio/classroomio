export interface MathEditLabels {
  insertMath: string;
  latexLabel: string;
  previewLabel: string;
  previewEmpty: string;
  done: string;
  cancel: string;
}

export const DEFAULT_MATH_EDIT_LABELS: MathEditLabels = {
  insertMath: 'Insert math',
  latexLabel: 'LaTeX',
  previewLabel: 'Preview',
  previewEmpty: 'Type LaTeX to see a preview',
  done: 'Done',
  cancel: 'Cancel'
};
