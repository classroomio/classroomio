export function normalizeNoteContentHtml(content: string | null | undefined): string {
  const html = String(content ?? '').trim();

  if (html === '' || html === '<p></p>' || html === '<p><br></p>') {
    return '';
  }

  return html;
}

export function isNoteContentEmpty(content: string | null | undefined): boolean {
  return normalizeNoteContentHtml(content) === '';
}
