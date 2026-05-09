export const UNTITLED_EXERCISE_SECTION_TITLE = 'Untitled section';

export function getExerciseSectionDisplayTitle({
  title,
  sectionNumber,
  sectionLabel
}: {
  title: string;
  sectionNumber: number;
  sectionLabel: string;
}) {
  if (title.trim() === UNTITLED_EXERCISE_SECTION_TITLE) return `${sectionLabel} ${sectionNumber}`;

  return title;
}
