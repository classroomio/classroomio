import { marked, type TokenizerAndRendererExtension, type Tokens } from 'marked';
import { readMathToken } from '@cio/utils/math';
import { renderLatexToHtml } from '@cio/ui/tools/render-math';

interface MathMarkdownToken extends Tokens.Generic {
  latex: string;
  display: boolean;
}

const MATH_START = /\$|\\[([]/;

function toMathToken(source: string, type: string): MathMarkdownToken | undefined {
  const mathToken = readMathToken(source, { brackets: true });
  if (!mathToken) return;

  return { type, raw: mathToken.raw, latex: mathToken.latex, display: mathToken.display };
}

const blockMath: TokenizerAndRendererExtension = {
  name: 'blockMath',
  level: 'block',
  start: (source) => source.match(/^\s*(\$\$|\\\[)/m)?.index,
  tokenizer: (source) => {
    const mathToken = toMathToken(source, 'blockMath');
    if (!mathToken?.display) return;

    const trailingWhitespace = /^[^\S\n]*(\n|$)/.exec(source.slice(mathToken.raw.length));
    if (!trailingWhitespace) return;

    return { ...mathToken, raw: mathToken.raw + trailingWhitespace[0] };
  },
  renderer: (token) => `<p>${renderLatexToHtml(token.latex, true)}</p>`
};

const inlineMath: TokenizerAndRendererExtension = {
  name: 'inlineMath',
  level: 'inline',
  start: (source) => source.match(MATH_START)?.index,
  tokenizer: (source) => toMathToken(source, 'inlineMath'),
  renderer: (token) => renderLatexToHtml(token.latex, token.display)
};

marked.use({ breaks: true, gfm: true, extensions: [blockMath, inlineMath] });

/**
 * Converts chat markdown to HTML, rendering `$…$`, `$$…$$`, `\\(…\\)` and `\\[…\\]` math with KaTeX.
 */
export function renderMarkdown(text: string): string {
  if (!text) return '';

  return marked.parse(text, { async: false }) as string;
}
