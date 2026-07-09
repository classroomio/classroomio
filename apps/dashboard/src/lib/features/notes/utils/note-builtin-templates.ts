import { TABLE_OF_CONTENTS_INITIAL_CONTENT } from '@cio/ui/custom/editor';

export interface NoteBuiltinTemplate {
  id: string;
  titleKey: string;
  descriptionKey: string;
  content: string;
}

export const NOTE_BUILTIN_TEMPLATES: NoteBuiltinTemplate[] = [
  {
    id: 'blank',
    titleKey: 'notes.templates.builtin.blank.title',
    descriptionKey: 'notes.templates.builtin.blank.description',
    content: ''
  },
  {
    id: 'table_of_contents',
    titleKey: 'notes.templates.builtin.table_of_contents.title',
    descriptionKey: 'notes.templates.builtin.table_of_contents.description',
    content: TABLE_OF_CONTENTS_INITIAL_CONTENT
  },
  {
    id: 'course_outline',
    titleKey: 'notes.templates.builtin.course_outline.title',
    descriptionKey: 'notes.templates.builtin.course_outline.description',
    content:
      '<h1>Course title</h1><p>One-line description of the course.</p><h2>Section 1</h2><h3>Lesson 1.1</h3><p>Lesson notes…</p><h3>Lesson 1.2</h3><p>Lesson notes…</p><h2>Section 2</h2><h3>Lesson 2.1</h3><p>Lesson notes…</p>'
  },
  {
    id: 'meeting_notes',
    titleKey: 'notes.templates.builtin.meeting_notes.title',
    descriptionKey: 'notes.templates.builtin.meeting_notes.description',
    content:
      '<h1>Meeting notes</h1><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h2>Agenda</h2><ul><li></li></ul><h2>Discussion</h2><p></p><h2>Action items</h2><ul><li></li></ul>'
  },
  {
    id: 'lesson_plan',
    titleKey: 'notes.templates.builtin.lesson_plan.title',
    descriptionKey: 'notes.templates.builtin.lesson_plan.description',
    content:
      '<h1>Lesson title</h1><h2>Objectives</h2><ul><li></li></ul><h2>Key concepts</h2><p></p><h2>Activities</h2><p></p><h2>Assessment</h2><p></p>'
  }
];
