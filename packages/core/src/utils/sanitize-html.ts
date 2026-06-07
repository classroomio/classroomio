import { createSanitizeHtmlConfig, stripSvgDataUrls } from '@cio/utils/functions';
import DOMPurify from 'isomorphic-dompurify';

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
