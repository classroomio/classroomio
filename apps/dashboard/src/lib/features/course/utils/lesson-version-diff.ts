import { diffArrays } from 'diff';

/**
 * Word-level diff of two HTML documents, rendered as HTML with changed text
 * wrapped in `<ins class="version-added">` / `<del class="version-removed">`.
 *
 * Lesson content is rich text stored as a single line of HTML — a 2,000
 * character lesson typically contains no newlines at all. Diffing it by line
 * therefore reports the entire document as one removed line plus one added
 * line, so changing a word in the middle of a paragraph highlighted the whole
 * lesson. Diffing raw HTML by word instead is no better on its own: a chunk
 * boundary can fall inside a tag, and assigning that fragment to `innerHTML`
 * lets the browser silently repair it into different markup.
 *
 * So tags are tokenized as atomic units and never wrapped or split. Only text
 * runs are marked up.
 */

interface PendingRun {
  kind: 'added' | 'removed' | null;
  text: string;
}

/** True when a token is a tag rather than text. Text never starts with `<` — it arrives escaped as `&lt;`. */
function isTag(token: string): boolean {
  return token.startsWith('<');
}

/**
 * Splits HTML into tags and whitespace-delimited words.
 *
 * Quotes are tracked while scanning a tag so a `>` inside an attribute value
 * (`alt="a > b"`) doesn't end the tag early.
 */
export function tokenizeHtml(html: string): string[] {
  const tokens: string[] = [];
  let index = 0;

  while (index < html.length) {
    if (html[index] === '<') {
      let cursor = index + 1;
      let quote: string | null = null;

      while (cursor < html.length) {
        const char = html[cursor];

        if (quote) {
          if (char === quote) quote = null;
        } else if (char === '"' || char === "'") {
          quote = char;
        } else if (char === '>') {
          break;
        }

        cursor += 1;
      }

      // An unterminated tag is emitted as-is rather than dropped.
      const end = cursor < html.length ? cursor + 1 : html.length;
      tokens.push(html.slice(index, end));
      index = end;
      continue;
    }

    const nextTag = html.indexOf('<', index);
    const textEnd = nextTag === -1 ? html.length : nextTag;
    const text = html.slice(index, textEnd);

    // Keep whitespace as its own token so words stay the unit of comparison
    // while spacing survives round-tripping.
    for (const piece of text.split(/(\s+)/)) {
      if (piece !== '') tokens.push(piece);
    }

    index = textEnd;
  }

  return tokens;
}

function wrapRun(run: PendingRun): string {
  if (run.kind === null || run.text === '') return '';

  // A run of pure whitespace carries no meaning to highlight.
  if (run.text.trim() === '') {
    return run.kind === 'added' ? run.text : '';
  }

  // Surrounding whitespace stays outside the marker: highlighting a trailing
  // space leaves a stray band of colour, and for a deletion the space is what
  // keeps the struck-through word from running into the next one.
  const [, leading, core, trailing] = run.text.match(/^(\s*)([\s\S]*?)(\s*)$/) as RegExpMatchArray;

  const marked =
    run.kind === 'added' ? `<ins class="version-added">${core}</ins>` : `<del class="version-removed">${core}</del>`;

  return `${leading}${marked}${trailing}`;
}

export function renderHtmlDiff(oldHtml: string, newHtml: string): string {
  const parts = diffArrays(tokenizeHtml(oldHtml ?? ''), tokenizeHtml(newHtml ?? ''));

  let html = '';
  let pending: PendingRun = { kind: null, text: '' };

  const flush = () => {
    html += wrapRun(pending);
    pending = { kind: null, text: '' };
  };

  for (const part of parts) {
    const kind = part.added ? 'added' : part.removed ? 'removed' : null;

    for (const token of part.value) {
      if (isTag(token)) {
        flush();

        // Structure follows the new document: tags that only exist in the old
        // one are dropped so the output can never be left unbalanced. Their
        // text still shows, marked as removed, inside the surrounding block.
        if (kind !== 'removed') html += token;
        continue;
      }

      if (kind === null) {
        flush();
        html += token;
        continue;
      }

      if (pending.kind !== kind) flush();

      pending.kind = kind;
      pending.text += token;
    }
  }

  flush();

  return html;
}
