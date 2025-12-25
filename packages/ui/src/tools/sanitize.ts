/**
 * HTML Sanitization utilities to prevent XSS attacks
 */
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

  let sanitized = DOMPurify.sanitize(html, {
    // Allow safe HTML tags
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'span',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'a',
      'img'
    ],
    // Allow safe attributes
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style'],
    // Forbid dangerous attributes
    FORBID_ATTR: [
      'onerror',
      'onload',
      'onclick',
      'onmouseover',
      'onfocus',
      'onblur',
      'onchange',
      'onsubmit',
      'onreset',
      'onselect',
      'onunload'
    ],
    // Forbid dangerous tags (including svg)
    FORBID_TAGS: [
      'script',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'textarea',
      'select',
      'button',
      'meta',
      'link',
      'svg',
      'math'
    ],
    // Keep content of forbidden tags
    KEEP_CONTENT: true,
    // Sanitize attributes
    SANITIZE_DOM: true,
    // Allow data attributes
    ALLOW_DATA_ATTR: false,
    // Transform URLs and filter dangerous protocols
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });

  // Additional post-processing to remove any SVG data URLs that might have slipped through
  sanitized = sanitized.replace(/src\s*=\s*["']data:image\/svg[^"']*["']/gi, 'src=""');

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

  // Remove on* event handlers (onclick, onload, onerror, etc.)
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove data: protocol for script execution
  html = html.replace(/\bdata:\s*text\/html/gi, 'data:text/plain');

  // Remove vbscript: protocol
  html = html.replace(/vbscript:/gi, '');

  // Remove expression() from CSS (IE specific XSS vector)
  html = html.replace(/expression\s*\(/gi, '');

  // Remove dangerous tags
  const dangerousTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'textarea',
    'select',
    'button',
    'svg',
    'math'
  ];
  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
    html = html.replace(regex, '');
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/>`, 'gi');
    html = html.replace(selfClosing, '');
    const unclosed = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    html = html.replace(unclosed, '');
  });

  return html;
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
