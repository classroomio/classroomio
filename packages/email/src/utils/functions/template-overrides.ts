import {
  DEFAULT_TEMPLATE_LOGO_URL,
  EMAIL_TEMPLATE_CONTENT_END_MARKER,
  EMAIL_TEMPLATE_CONTENT_START_MARKER
} from '../../templates/default';

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

function normalizeFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}

export function interpolateTemplatePlaceholders(content: string, fields: Record<string, unknown>): string {
  return content.replace(PLACEHOLDER_REGEX, (_match, key: string) => normalizeFieldValue(fields[key]));
}

function replaceTemplateContent(templateHtml: string, content: string): string {
  const startIndex = templateHtml.indexOf(EMAIL_TEMPLATE_CONTENT_START_MARKER);
  const endIndex = templateHtml.indexOf(EMAIL_TEMPLATE_CONTENT_END_MARKER);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const prefix = templateHtml.slice(0, startIndex + EMAIL_TEMPLATE_CONTENT_START_MARKER.length);
    const suffix = templateHtml.slice(endIndex);
    return `${prefix}\n    ${content}\n    ${suffix}`;
  }

  // Fallback for templates without explicit markers.
  return templateHtml.replace(
    /(<div class="wrap"[\s\S]*?>)([\s\S]*?)(<\/div>\s*<div class="footer")/,
    `$1${content}$3`
  );
}

function replaceTemplateLogo(templateHtml: string, logoUrl: string): string {
  const logoRegex = /<img([^>]*data-cio-logo[^>]*?)src="[^"]*"([^>]*?)>/;
  if (logoRegex.test(templateHtml)) {
    return templateHtml.replace(logoRegex, `<img$1src="${logoUrl}"$2>`);
  }

  return templateHtml.replace(DEFAULT_TEMPLATE_LOGO_URL, logoUrl);
}

export function applyDefaultTemplateOverrides(
  defaultHtml: string,
  options: {
    content?: string | null;
    logoUrl?: string | null;
    fields?: Record<string, unknown>;
  }
): string {
  let output = defaultHtml;

  if (options.content !== undefined && options.content !== null) {
    const renderedContent = options.fields
      ? interpolateTemplatePlaceholders(options.content, options.fields)
      : options.content;
    output = replaceTemplateContent(output, renderedContent);
  }

  if (options.logoUrl && options.logoUrl.trim().length > 0) {
    output = replaceTemplateLogo(output, options.logoUrl);
  }

  return output;
}
