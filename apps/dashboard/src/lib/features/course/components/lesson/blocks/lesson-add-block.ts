import { lessonBlocksApi } from '$features/course/store/lesson-blocks.svelte';
import { EXAMPLE_NOTE_HTML } from '$features/course/utils/lesson-blocks';
import type { TLocale } from '@cio/db/types';
import type { LessonBlockInsertType } from '$features/course/utils/types';

export function addLessonBlock(type: LessonBlockInsertType, index: number, locale: TLocale): void {
  if (type === 'note') {
    lessonBlocksApi.addNoteBlock(index, locale, EXAMPLE_NOTE_HTML);
    return;
  }

  if (type === 'image') {
    lessonBlocksApi.addImageBlock(index);
    return;
  }

  if (type === 'video') {
    lessonBlocksApi.addExampleVideo(index);
    return;
  }

  if (type === 'document') {
    lessonBlocksApi.addExampleDocument(index);
    return;
  }

  lessonBlocksApi.addExampleSlide(index);
}
