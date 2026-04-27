export const FORBID_TAGS = [
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
  'foreignObject',
  'math'
] as const;

export const FORBID_ATTR = [
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
] as const;

export const ADD_ATTR = ['data-type', 'data-latex', 'colwidth'] as const;

export const ALLOWED_URI_REGEXP =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

export function createSanitizeHtmlConfig() {
  return {
    FORBID_TAGS: [...FORBID_TAGS],
    FORBID_ATTR: [...FORBID_ATTR],
    ADD_ATTR: [...ADD_ATTR],
    KEEP_CONTENT: true,
    SANITIZE_DOM: true,
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP
  };
}

export function stripSvgDataUrls(html: string): string {
  return html.replace(/src\s*=\s*["']data:image\/svg[^"']*["']/gi, 'src=""');
}
