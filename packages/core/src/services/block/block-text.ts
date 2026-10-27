import type { TLocale } from '@cio/db/types';
import { loadLessonBlocks } from './block-view';

/**
 * Joins the lesson's note blocks in display order for one locale, as HTML.
 * @returns null when no note block has content in that locale.
 */
export async function getLessonNoteHtml(lessonId: string, locale: TLocale): Promise<string | null> {
  const blocks = await loadLessonBlocks(lessonId);
  const html = blocks
    .filter((block) => block.type === 'note')
    .map((block) => block.contents[locale])
    .filter((content): content is string => typeof content === 'string' && content.length > 0)
    .join('\n');

  return html.length > 0 ? html : null;
}
