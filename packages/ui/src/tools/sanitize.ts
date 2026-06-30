/**
 * HTML Sanitization utilities to prevent XSS attacks
 */
import { createSanitizeHtmlConfig, FORBID_TAGS, stripSvgDataUrls } from '@cio/utils/functions';
import DOMPurify from 'dompurify';

const browser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Sanitizes HTML content using DOMPurify to prevent XSS attacks
 * This provides robust client-side protection against XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';

  // Only run DOMPurify in the browser
  if (!browser) {
    return fallbackSanitize(html);
  }

  let sanitized = String(DOMPurify.sanitize(html, createSanitizeHtmlConfig()));

  // Additional post-processing to remove any SVG data URLs that might have slipped through
  sanitized = stripSvgDataUrls(sanitized);

  return sanitized;
}

/**
 * Fallback sanitization for server-side rendering
 */
function fallbackSanitize(html: string): string {
  if (typeof html !== 'string') return '';

  // Remove SVG tags and their content completely
  html = html.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  html = html.replace(/<svg\b[^>]*\/>/gi, '');

  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove javascript: protocol from attributes
  html = html.replace(/javascript:/gi, '');

  // Remove data:image/svg URLs which can contain XSS
  html = html.replace(/src\s*=\s*["']data:image\/svg[^"']*["']/gi, 'src=""');

  // Remove on* event handlers (onclick, onload, onerror, etc.).
  // `\s+` (not `\s*`) is required so we only match real tag attributes — which
  // are always preceded by whitespace inside `<tag …>`. Using `\s*` lets the
  // regex anchor mid-word (e.g. `onse` inside `response`) and chew through
  // unrelated text content, including closing tags, which produces unclosed
  // elements that the browser's adoption-agency parser then re-opens on every
  // sibling. See: lesson body containing `response = httpClient.fetch(url);`.
  html = html.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '');
  html = html.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');
  html = html.replace(/\s+on\w+\s*=\s*[^\s"'>]+/gi, '');

  // Remove data: protocol for script execution
  html = html.replace(/\bdata:\s*text\/html/gi, 'data:text/plain');

  // Remove vbscript: protocol
  html = html.replace(/vbscript:/gi, '');

  // Remove expression() from CSS (IE specific XSS vector)
  html = html.replace(/expression\s*\(/gi, '');

  // Remove dangerous tags
  FORBID_TAGS.forEach((tag: string) => {
    const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
    html = html.replace(regex, '');
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/>`, 'gi');
    html = html.replace(selfClosing, '');
    const unclosed = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    html = html.replace(unclosed, '');
  });

  return html;
}

export type ContentSegment = { type: 'html'; content: string } | { type: 'svg'; content: string };

function fallbackSanitizeSvg(svg: string): string {
  let output = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  output = output.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  output = output.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  return output;
}

/**
 * SVG shown inside `srcdoc` + `sandbox=""` cannot run scripts; stripping
 * script and handler vectors avoids console errors and matches the sandbox intent.
 */
export function sanitizeSvgForSandbox(svg: string): string {
  if (typeof svg !== 'string' || !svg) return '';

  if (!browser) {
    return fallbackSanitizeSvg(svg);
  }

  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true }
  });
}

/**
 * Splits HTML into safe-HTML segments and sandbox-safe SVG segments.
 * HTML segments are sanitized; SVG segments are sanitized for iframe `srcdoc`
 * so embedded scripts are removed (the iframe stays `sandbox=""` without
 * `allow-scripts`).
 */
export function splitHtmlAndSvg(html: string): ContentSegment[] {
  if (typeof html !== 'string' || !html) return [];

  const segments: ContentSegment[] = [];
  const svgRegex = /<svg\b[^>]*>[\s\S]*?<\/svg>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = svgRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'html', content: sanitizeHtml(html.slice(lastIndex, match.index)) });
    }
    segments.push({ type: 'svg', content: sanitizeSvgForSandbox(match[0]) });
    lastIndex = svgRegex.lastIndex;
  }

  if (lastIndex < html.length) {
    segments.push({ type: 'html', content: sanitizeHtml(html.slice(lastIndex)) });
  }

  return segments;
}

/**
 * Sanitizes an embed code snippet (e.g. a pasted <iframe>). Allows only
 * <iframe> tags with https: sources; everything else is stripped. Use this
 * for org landing-page embed sections — not for general rich-text content.
 */
export function sanitizeEmbedHtml(html: string): string {
  if (typeof html !== 'string') return '';
  if (!browser) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['iframe'],
    ALLOWED_ATTR: [
      'src',
      'width',
      'height',
      'frameborder',
      'marginheight',
      'marginwidth',
      'title',
      'loading',
      'allow',
      'allowfullscreen',
      'sandbox'
    ],
    ALLOWED_URI_REGEXP: /^https:/i
  });
}

/**
 * Strips all HTML tags and returns plain text
 * Use this when you only need the text content
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escapes HTML special characters to prevent XSS
 * Use this when displaying user input as text
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'/]/g, (s) => map[s]);
}

/**
 * Validates and sanitizes URLs to prevent javascript: and data: XSS vectors
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';

  // Remove dangerous protocols
  if (/^(javascript|vbscript|data|file):/i.test(url.trim())) {
    return '';
  }

  return url;
}
