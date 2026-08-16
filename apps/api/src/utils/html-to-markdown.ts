import { sanitizeHtml } from '@cio/core/utils/sanitize-html';
import TurndownService from 'turndown';

const VIDEO_HOST_RE = /(?:^|\.)(?:youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com|loom\.com)$/i;

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
  strongDelimiter: '**',
  hr: '---'
});

turndown.addRule('strikethrough', {
  filter: ['del', 's'],
  replacement(content) {
    return `~~${content}~~`;
  }
});

turndown.addRule('table', {
  filter: 'table',
  replacement(_content, node) {
    const table = node as HTMLTableElement;
    const rows = Array.from(table.querySelectorAll('tr'));

    if (rows.length === 0) return '';

    const cellText = (cell: Element) => (cell.textContent ?? '').replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');

    const toRow = (row: Element) => {
      const cells = Array.from(row.querySelectorAll('th, td')).map(cellText);

      return `| ${cells.join(' | ')} |`;
    };

    const header = rows[0];
    const colCount = header.querySelectorAll('th, td').length;
    const divider = `| ${Array.from({ length: colCount }, () => '---').join(' | ')} |`;
    const body = rows.slice(1).map(toRow).join('\n');

    return `\n\n${toRow(header)}\n${divider}${body ? `\n${body}` : ''}\n\n`;
  }
});

function isVideoHostUrl(href: string): boolean {
  try {
    const parsed = new URL(href, 'https://invalid.example');

    return VIDEO_HOST_RE.test(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Drop iframes, video elements, and anchors that point at known video hosts
 * (YouTube, Vimeo, Loom). Defence-in-depth on top of the HTML sanitiser.
 */
export function stripVideoEmbeds(html: string): string {
  let result = html.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');
  result = result.replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, '');
  result = result.replace(/<video\b[^>]*\/?\s*>/gi, '');
  result = result.replace(/<source\b[^>]*\/?\s*>/gi, '');
  result = result.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (match, attrs: string) => {
    const hrefMatch = /href\s*=\s*(["'])(.*?)\1/i.exec(attrs);

    if (hrefMatch && isVideoHostUrl(hrefMatch[2] ?? '')) {
      return '';
    }

    return match;
  });

  return result;
}

export function htmlToMarkdown(html: string): string {
  const sanitized = sanitizeHtml(html ?? '');
  const withoutVideo = stripVideoEmbeds(sanitized);
  const markdown = turndown.turndown(withoutVideo);

  return markdown.replace(/\r\n/g, '\n').trim();
}

export function formatLessonMarkdownDocument(input: {
  courseTitle: string;
  lessonTitle: string;
  bodyHtml: string;
}): string {
  const body = htmlToMarkdown(input.bodyHtml);
  const heading = `# ${input.courseTitle} — ${input.lessonTitle}`;

  if (!body) {
    return `${heading}\n`;
  }

  return `${heading}\n\n${body}\n`;
}
