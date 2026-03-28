import { Context } from 'runed';
import type { ReadableBoxedValues, WritableBoxedValues } from 'svelte-toolbelt';
import type { CodeRootProps } from './types';
import { highlighter } from './shiki';
import type { HighlighterCore } from 'shiki';
import sanitizeHtml from 'sanitize-html';
import type { IOptions as SanitizeHtmlOptions } from 'sanitize-html';

/** Shiki HTML only; avoids isomorphic-dompurify/jsdom (CommonJS `require` breaks Vite ESM SSR). */
const SHIKI_HIGHLIGHT_SANITIZE: SanitizeHtmlOptions = {
  allowedTags: ['pre', 'code', 'span', 'div', 'br'],
  allowedAttributes: {
    pre: ['class', 'style', 'tabindex'],
    code: ['class', 'style'],
    span: ['class', 'style'],
    div: ['class', 'style'],
    br: ['class', 'style']
  },
  allowedStyles: {
    '*': {
      color: [
        /^#[0-9a-f]{3,8}$/i,
        /^rgb\(/i,
        /^rgba\(/i,
        /^hsl\(/i,
        /^hsla\(/i,
        /^var\(/,
        /^inherit$/i,
        /^initial$/i,
        /^currentColor$/i,
        /^transparent$/i,
        /^unset$/i,
        /^color-mix\(/i
      ],
      'background-color': [
        /^#[0-9a-f]{3,8}$/i,
        /^rgb\(/i,
        /^rgba\(/i,
        /^hsl\(/i,
        /^hsla\(/i,
        /^var\(/,
        /^inherit$/i,
        /^initial$/i,
        /^transparent$/i,
        /^unset$/i,
        /^color-mix\(/i
      ],
      'font-style': [/^[\w-]+$/, /^var\(/],
      'font-weight': [/^\d+$/, /^[\w-]+$/, /^var\(/],
      'text-decoration': [/^[\w\s-]+$/, /^var\(/]
    }
  }
};

function sanitizeShikiHtml(html: string): string {
  return sanitizeHtml(html, SHIKI_HIGHLIGHT_SANITIZE);
}

type CodeOverflowStateProps = WritableBoxedValues<{
  collapsed: boolean;
}>;

class CodeOverflowState {
  constructor(readonly opts: CodeOverflowStateProps) {
    this.toggleCollapsed = this.toggleCollapsed.bind(this);
  }

  toggleCollapsed() {
    this.opts.collapsed.current = !this.opts.collapsed.current;
  }

  get collapsed() {
    return this.opts.collapsed.current;
  }
}

type CodeRootStateProps = ReadableBoxedValues<{
  code: string;
  lang: NonNullable<CodeRootProps['lang']>;
  hideLines: boolean;
  highlight: CodeRootProps['highlight'];
}>;

class CodeRootState {
  highlighter: HighlighterCore | null = $state(null);

  constructor(
    readonly opts: CodeRootStateProps,
    readonly overflow?: CodeOverflowState
  ) {
    highlighter.then((hl) => (this.highlighter = hl));
  }

  highlight(code: string) {
    return this.highlighter?.codeToHtml(code, {
      lang: this.opts.lang.current,
      themes: {
        light: 'github-light-default',
        dark: 'github-dark-default'
      },
      transformers: [
        {
          pre: (el) => {
            el.properties.style = '';

            if (!this.opts.hideLines.current) {
              el.properties.class += ' line-numbers';
            }

            return el;
          },
          line: (node, line) => {
            if (within(line, this.opts.highlight.current)) {
              node.properties.class = node.properties.class + ' line--highlighted';
            }

            return node;
          }
        }
      ]
    });
  }

  get code() {
    return this.opts.code.current;
  }

  highlighted = $derived(sanitizeShikiHtml(this.highlight(this.code) ?? ''));
}

function within(num: number, range: CodeRootProps['highlight']) {
  if (!range) return false;

  let within = false;

  for (const r of range) {
    if (typeof r === 'number') {
      if (num === r) {
        within = true;
        break;
      }
      continue;
    }

    if (r[0] <= num && num <= r[1]) {
      within = true;
      break;
    }
  }

  return within;
}

class CodeCopyButtonState {
  constructor(readonly root: CodeRootState) {}

  get code() {
    return this.root.opts.code.current;
  }
}

const overflowCtx = new Context<CodeOverflowState>('code-overflow-state');

const ctx = new Context<CodeRootState>('code-root-state');

export function useCodeOverflow(props: CodeOverflowStateProps) {
  return overflowCtx.set(new CodeOverflowState(props));
}

export function useCode(props: CodeRootStateProps) {
  return ctx.set(new CodeRootState(props, overflowCtx.getOr(undefined)));
}

export function useCodeCopyButton() {
  return new CodeCopyButtonState(ctx.get());
}
