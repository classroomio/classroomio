import katex from 'katex';

import { renderEditorMath, renderMathText } from './math-text';

/** Renders LaTeX to MathML, which email clients and the certificate renderer display without KaTeX CSS. */
export function renderLatexToMathml(latex: string, display = false): string {
  return katex.renderToString(latex, { output: 'mathml', throwOnError: false, displayMode: display });
}

/** Returns escaped HTML for a `$…$` string with its math as MathML. */
export function renderMathTextToMathml(text: string): string {
  return renderMathText(text, renderLatexToMathml);
}

/** Fills the rich-text editor math elements in trusted HTML with MathML. */
export function renderEditorMathToMathml(html: string): string {
  return renderEditorMath(html, renderLatexToMathml);
}
