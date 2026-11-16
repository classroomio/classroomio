import { COURSE_COMMENT_CONTEXT_LENGTH, COURSE_COMMENT_QUOTE_MAX_LENGTH } from '../constants/course-comment';

/** One run of source text. `position` is where its first character sits in the source, when known. */
export interface TAnchorTextPiece {
  text: string;
  position: number | null;
}

export interface TAnchorText {
  text: string;
  /** Source position of every character of `text`, or null when the source has no positions. */
  positions: Array<number | null>;
}

export interface TTextAnchorTarget {
  quote: string;
  prefix: string;
  suffix: string;
  start: number;
}

export interface TTextAnchorMatch {
  start: number;
  end: number;
}

export const ANCHOR_TEXT_BLOCK_BREAK = '\n';

const COLLAPSIBLE_WHITESPACE = /[^\S\n]/;

/**
 * Joins pieces into the text anchors are matched against: whitespace runs collapse to one space,
 * block breaks collapse to one newline, and leading/trailing whitespace is dropped. Every
 * surface (server HTML, editor document, rendered view) must build its pieces from the same rules.
 */
export function normalizeAnchorText(pieces: TAnchorTextPiece[]): TAnchorText {
  let text = '';
  const positions: Array<number | null> = [];
  let pendingSeparator: '' | ' ' | '\n' = '';

  for (const piece of pieces) {
    for (let index = 0; index < piece.text.length; index += 1) {
      const character = piece.text[index];
      const position = piece.position === null ? null : piece.position + index;

      if (character === ANCHOR_TEXT_BLOCK_BREAK) {
        pendingSeparator = '\n';
        continue;
      }

      if (COLLAPSIBLE_WHITESPACE.test(character)) {
        if (pendingSeparator !== '\n') pendingSeparator = ' ';
        continue;
      }

      if (pendingSeparator && text.length > 0) {
        text += pendingSeparator;
        positions.push(position);
      }

      pendingSeparator = '';
      text += character;
      positions.push(position);
    }
  }

  return { text, positions };
}

/** Collapses whitespace in a free-standing string the same way `normalizeAnchorText` does. */
export function normalizeAnchorString(value: string): string {
  return normalizeAnchorText([{ text: value, position: null }]).text;
}

function sharedSuffixLength(left: string, right: string): number {
  let length = 0;

  while (
    length < left.length &&
    length < right.length &&
    left[left.length - 1 - length] === right[right.length - 1 - length]
  ) {
    length += 1;
  }

  return length;
}

function sharedPrefixLength(left: string, right: string): number {
  let length = 0;

  while (length < left.length && length < right.length && left[length] === right[length]) {
    length += 1;
  }

  return length;
}

function findOccurrences(text: string, quote: string): number[] {
  const occurrences: number[] = [];
  let from = text.indexOf(quote);

  while (from !== -1) {
    occurrences.push(from);
    from = text.indexOf(quote, from + 1);
  }

  return occurrences;
}

/**
 * Finds a commented quote in `text`. A single occurrence wins outright. With several, the one whose
 * surrounding text best matches `prefix`/`suffix` wins; a tie is broken only by the stored start,
 * and an unresolved tie returns null so the thread is flagged instead of attached to a guess.
 */
export function findTextAnchor(text: string, target: TTextAnchorTarget): TTextAnchorMatch | null {
  const quote = normalizeAnchorString(target.quote);
  if (!quote) return null;

  const occurrences = findOccurrences(text, quote);
  if (occurrences.length === 0) return null;
  if (occurrences.length === 1) return { start: occurrences[0], end: occurrences[0] + quote.length };

  const prefix = normalizeAnchorString(target.prefix);
  const suffix = normalizeAnchorString(target.suffix);
  const scored = occurrences.map((start) => {
    const before = text.slice(Math.max(0, start - COURSE_COMMENT_CONTEXT_LENGTH), start).trimEnd();
    const after = text.slice(start + quote.length, start + quote.length + COURSE_COMMENT_CONTEXT_LENGTH).trimStart();
    const score = sharedSuffixLength(before, prefix.trimEnd()) + sharedPrefixLength(after, suffix.trimStart());

    return { start, score };
  });

  const bestScore = Math.max(...scored.map((candidate) => candidate.score));
  const best = scored.filter((candidate) => candidate.score === bestScore);
  const winner = best.length === 1 ? best[0] : best.find((candidate) => candidate.start === target.start);

  return winner ? { start: winner.start, end: winner.start + quote.length } : null;
}

/**
 * Builds what a text thread stores from a selection over anchor text. Surrounding whitespace in the
 * selection is dropped. Returns null for an empty or too long selection.
 */
export function captureTextAnchor(text: string, start: number, end: number): TTextAnchorTarget | null {
  const selected = text.slice(start, end);
  const leadingWhitespace = selected.length - selected.trimStart().length;
  const quote = selected.trim();
  if (!quote || quote.length > COURSE_COMMENT_QUOTE_MAX_LENGTH) return null;

  const quoteStart = start + leadingWhitespace;
  const quoteEnd = quoteStart + quote.length;

  return {
    quote,
    prefix: text.slice(Math.max(0, quoteStart - COURSE_COMMENT_CONTEXT_LENGTH), quoteStart),
    suffix: text.slice(quoteEnd, quoteEnd + COURSE_COMMENT_CONTEXT_LENGTH),
    start: quoteStart
  };
}
