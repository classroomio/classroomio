import { resolveLessonSlides } from '@cio/utils/functions';
import type { TLocale } from '@cio/db/types';
import type {
  Lesson,
  LessonBlock,
  LessonBlockInsertType,
  LessonDocument,
  LessonImageBlock,
  LessonNoteBlock,
  LessonReadingDensity,
  LessonSlideBlock,
  LessonVideoBlock
} from './types';

type LessonVideo = NonNullable<Lesson['videos']>[number];
type LessonSlide = ReturnType<typeof resolveLessonSlides>[number];

export const EXAMPLE_VIDEO_URL = 'https://youtu.be/KrnMm5CRBK4?si=76KSQSuoIKYwjRrd';
export const EXAMPLE_IMAGE_URL = '/images/classroomio-course-img-template.jpg';
export const EXAMPLE_IMAGE_ALT = 'ClassroomIO course banner';
export const DEFAULT_READING_DENSITY: LessonReadingDensity = 'comfortable';
export const EXAMPLE_SLIDE_SRC = 'https://www.canva.com/design/DAHZZoQ13Q8/FX5Rvle9NYCI7AG4CMmvIQ/view?embed';
export const EXAMPLE_SLIDE_PLATFORM = 'canva' as const;
export const EXAMPLE_DOCUMENT_BLOCK_KEY = 'lesson-example-document';

export const EXAMPLE_NOTE_HTML = `<h2>Lesson overview</h2><p>Use this note to introduce the lesson and set expectations. Replace this guidance with the ideas your learners need.</p><ul><li>What the lesson covers</li><li>Why it matters</li><li>What learners will do next</li></ul>`;

export const LESSON_READING_DENSITY_OPTIONS: { value: LessonReadingDensity; labelKey: string }[] = [
  { value: 'compact', labelKey: 'course.navItem.lessons.materials.blocks.reading_density.compact' },
  { value: 'comfortable', labelKey: 'course.navItem.lessons.materials.blocks.reading_density.comfortable' },
  { value: 'spacious', labelKey: 'course.navItem.lessons.materials.blocks.reading_density.spacious' }
];

const READING_DENSITY_SPACING: Record<LessonReadingDensity, string> = {
  compact: 'gap-6',
  comfortable: 'gap-10',
  spacious: 'gap-16'
};

export function getReadingDensitySpacingClass(density: LessonReadingDensity): string {
  return READING_DENSITY_SPACING[density];
}

export const EXAMPLE_VIDEO_KEY_PREFIX = 'lesson-example-';

export function isExampleVideoKey(sourceKey: string): boolean {
  return sourceKey.startsWith(EXAMPLE_VIDEO_KEY_PREFIX);
}

export function createLessonBlockId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `lesson-block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function lessonVideoKey(video: LessonVideo): string {
  const candidate =
    (video as LessonVideo & { assetId?: string; key?: string }).assetId ??
    (video as LessonVideo & { key?: string }).key ??
    video.link;

  return typeof candidate === 'string' && candidate.length > 0 ? candidate : JSON.stringify(video);
}

export function lessonSlideKey(slide: LessonSlide): string {
  return slide.id || slide.src;
}

export function lessonDocumentKey(document: LessonDocument): string {
  return document.key || document.link || document.name;
}

export function createNoteBlock(
  content: string,
  locale: TLocale
): { block: LessonNoteBlock; translations: Record<string, string> } {
  const block: LessonNoteBlock = {
    id: createLessonBlockId(),
    type: 'note',
    style: 'default'
  };

  return { block, translations: { [locale]: content } };
}

function resolveExampleImageUrl(): string {
  if (typeof window === 'undefined') return EXAMPLE_IMAGE_URL;

  return new URL(EXAMPLE_IMAGE_URL, window.location.origin).href;
}

export function createImageBlock(): LessonImageBlock {
  return {
    id: createLessonBlockId(),
    type: 'image',
    url: resolveExampleImageUrl(),
    alt: EXAMPLE_IMAGE_ALT,
    fit: 'cover',
    isExample: true
  };
}

export function createVideoBlock(sourceKey: string, isExample = false): LessonVideoBlock {
  return {
    id: createLessonBlockId(),
    type: 'video',
    sourceKey,
    isExample
  };
}

export function createSlideBlock(sourceKey: string, isExample = false): LessonSlideBlock {
  return {
    id: createLessonBlockId(),
    type: 'slide',
    sourceKey,
    isExample
  };
}

export function createDocumentBlock(sourceKey: string, isExample = false): LessonBlock {
  return {
    id: createLessonBlockId(),
    type: 'document',
    sourceKey,
    isExample
  };
}

export function createExampleDocumentBlock(): LessonBlock {
  return createDocumentBlock(EXAMPLE_DOCUMENT_BLOCK_KEY, true);
}

export function insertLessonBlock(blocks: LessonBlock[], block: LessonBlock, index: number): LessonBlock[] {
  const next = [...blocks];
  const safeIndex = Math.max(0, Math.min(index, next.length));

  next.splice(safeIndex, 0, block);
  return next;
}

export function upsertLessonBlock(
  blocks: LessonBlock[],
  block: LessonBlock,
  index: number,
  replacedId?: string
): LessonBlock[] {
  const matchIndex = blocks.findIndex((candidate) => candidate.id === block.id || candidate.id === replacedId);

  if (matchIndex === -1) return insertLessonBlock(blocks, block, index);

  return blocks.map((candidate, candidateIndex) => (candidateIndex === matchIndex ? block : candidate));
}

export function moveLessonBlock(blocks: LessonBlock[], blockId: string, direction: -1 | 1): LessonBlock[] {
  const index = blocks.findIndex((block) => block.id === blockId);
  const targetIndex = index + direction;

  if (index === -1 || targetIndex < 0 || targetIndex >= blocks.length) {
    return blocks;
  }

  const next = [...blocks];
  const [block] = next.splice(index, 1);
  next.splice(targetIndex, 0, block);
  return next;
}

export function createExampleVideo(): LessonVideo {
  return {
    type: 'generic',
    link: EXAMPLE_VIDEO_URL,
    key: `${EXAMPLE_VIDEO_KEY_PREFIX}${createLessonBlockId()}`,
    fileName: 'ClassroomIO product demo',
    metadata: {
      title: 'ClassroomIO product demo',
      createdAt: new Date().toISOString(),
      mimeType: 'video/mp4'
    }
  } as LessonVideo;
}

export function isLessonBlockInsertType(type: string): type is LessonBlockInsertType {
  return type === 'video' || type === 'note' || type === 'slide' || type === 'document' || type === 'image';
}

/**
 * Block slides are keyed by their embed source, while the lesson payload keys them
 * by row id, so match on either before falling back to the id.
 */
export function slideMatchesSourceKey(slide: LessonSlide, sourceKey: string): boolean {
  return slide.src === sourceKey || lessonSlideKey(slide) === sourceKey;
}
