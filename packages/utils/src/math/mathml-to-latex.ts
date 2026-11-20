import { MathMLToLaTeX } from 'mathml-to-latex';

import { decodeMarkupEntities } from './omml';

const TEX_ANNOTATION = /<annotation\b[^>]*\bencoding\s*=\s*["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/i;
const DISPLAY_STYLE = /^\s*\{\\displaystyle\s*([\s\S]*)\}\s*$/;
const DISPLAY_BLOCK = /^<(?:\w+:)?math\b[^>]*\bdisplay\s*=\s*["']block["']/i;

/**
 * Converts a MathML `<math>` element to LaTeX, preferring its TeX annotation (KaTeX and MathJax output carry
 * one). Returns '' when the markup cannot be converted.
 */
export function mathmlToLatex(mathml: string): string {
  const annotation = TEX_ANNOTATION.exec(mathml)?.[1];
  if (!annotation) return convertPresentationMathml(mathml);

  return decodeMarkupEntities(annotation)
    .replace(DISPLAY_STYLE, (_match, body: string) => body)
    .trim();
}

function convertPresentationMathml(mathml: string): string {
  try {
    return MathMLToLaTeX.convert(mathml.replace(/&nbsp;/g, '&#160;')).trim();
  } catch {
    return '';
  }
}

export function isDisplayMathml(mathml: string): boolean {
  return DISPLAY_BLOCK.test(mathml.trim());
}
