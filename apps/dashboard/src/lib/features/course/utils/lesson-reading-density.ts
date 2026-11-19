import type { LessonReadingDensity } from './types';

export const DEFAULT_READING_DENSITY: LessonReadingDensity = 'compact';

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
