import type { TLocale } from '@cio/db/types';
import { blockHasLocalizedContent } from '@cio/utils/validation/block';
import { loadLessonBlocks } from './block-view';

/**
 * Joins the lesson's localized block content (note HTML) in display order for one locale.
 * @returns null when no block has content in that locale.
 */
export async function getLessonNoteHtml(lessonId: string, locale: TLocale): Promise<string | null> {
  const blocks = await loadLessonBlocks(lessonId);
  const html = blocks
    .filter((block) => blockHasLocalizedContent(block.type))
    .map((block) => block.contents[locale])
    .filter((content): content is string => typeof content === 'string' && content.length > 0)
    .join('\n');

  return html.length > 0 ? html : null;
}
