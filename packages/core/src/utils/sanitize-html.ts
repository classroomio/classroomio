import { createSanitizeHtmlConfig, stripSvgDataUrls } from '@cio/utils/functions';
import { neutraliseLatexMarkup, sanitizeMathPlainText } from '@cio/utils/math';
import DOMPurify from 'isomorphic-dompurify';

const PLAIN_TEXT_CONFIG = { ALLOWED_TAGS: [], ALLOWED_ATTR: [] };
const HTML_SETTING_KEYS = new Set(['description']);
const LATEX_SETTING_KEYS = new Set(['acceptedAnswers', 'answer', 'correctValue', 'expression', 'unit', 'variables']);
const ESCAPED_TAG_START = /&lt;(?=[a-zA-Z/!?])/g;

function stripMarkup(text: string): string {
  if (!text) return text;

  return DOMPurify.sanitize(text, PLAIN_TEXT_CONFIG)
    .replace(ESCAPED_TAG_START, '\u0000')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\u0000/g, '&lt;');
}

export function sanitizeHtml(html: string): string {
  let sanitized = DOMPurify.sanitize(html, createSanitizeHtmlConfig());

  sanitized = stripSvgDataUrls(sanitized);

  return sanitized;
}

export function sanitizeOptionalHtml(html: string | undefined): string | undefined;
export function sanitizeOptionalHtml(html: string | null | undefined): string | null | undefined;
export function sanitizeOptionalHtml(html: string | null | undefined): string | null | undefined {
  if (html == null) return html;

  return sanitizeHtml(html);
}

export function sanitizeUnknownStrings<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeHtml(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknownStrings(item)) as T;
  }

  if (value && typeof value === 'object') {
    const sanitizedEntries = Object.entries(value).map(([key, entryValue]) => [
      key,
      sanitizeUnknownStrings(entryValue)
    ]);

    return Object.fromEntries(sanitizedEntries) as T;
  }

  return value;
}

/**
 * Sanitizes a plain-string field that shows as text with `$…$` math, such as a question title or an option label.
 * Markup is stripped outside math; math keeps `<`, `>` and `&` so `x<5` and matrices survive.
 */
export function sanitizeMathText(text: string): string {
  return sanitizeMathPlainText(text, stripMarkup);
}

/**
 * Sanitizes question or option settings. `description` is rich-text HTML, answer keys are raw LaTeX, and every other
 * string is plain text with optional `$…$` math.
 */
export function sanitizeQuestionSettings<T>(value: T, key = ''): T {
  if (typeof value === 'string') {
    if (HTML_SETTING_KEYS.has(key)) return sanitizeHtml(value) as T;
    if (LATEX_SETTING_KEYS.has(key)) return neutraliseLatexMarkup(value) as T;

    return sanitizeMathText(value) as T;
  }

  if (Array.isArray(value)) return value.map((item) => sanitizeQuestionSettings(item, key)) as T;

  if (value && typeof value === 'object') {
    const sanitizedEntries = Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      sanitizeQuestionSettings(entryValue, entryKey)
    ]);

    return Object.fromEntries(sanitizedEntries) as T;
  }

  return value;
}
