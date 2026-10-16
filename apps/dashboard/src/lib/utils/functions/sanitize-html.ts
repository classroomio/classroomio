import DOMPurify from 'isomorphic-dompurify';
import { createSanitizeHtmlConfig, stripSvgDataUrls } from '@cio/utils/functions';

/**
 * Sanitizes tutor-authored HTML for `{@html}` sinks. Mirrors the server-side
 * scrub so already-clean markup passes through unchanged.
 */
export function sanitizeHtml(html: string): string {
  return stripSvgDataUrls(DOMPurify.sanitize(html, createSanitizeHtmlConfig()));
}
