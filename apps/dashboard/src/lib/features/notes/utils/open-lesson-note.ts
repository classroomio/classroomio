import { sidePanel } from '$features/side-panel';

export const LESSON_NOTE_PANEL_ID = 'lesson-note';

export function openLessonNotePanel(props: { courseId: string; lessonId: string }) {
  sidePanel.toggle(LESSON_NOTE_PANEL_ID, props);
}
