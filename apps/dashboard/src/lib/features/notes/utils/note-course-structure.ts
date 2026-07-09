export interface NoteCourseLessonDraft {
  id: string;
  title: string;
  content: string;
}

export interface NoteCourseSectionDraft {
  id: string;
  title: string;
  lessons: NoteCourseLessonDraft[];
}

export interface NoteCourseStructureDraft {
  courseTitle: string;
  sections: NoteCourseSectionDraft[];
  unsectionedLessons: NoteCourseLessonDraft[];
}

interface ParsedBlock {
  level: number;
  title: string;
  content: string;
}

function createLessonId() {
  return crypto.randomUUID();
}

function splitHtmlByHeadings(html: string): ParsedBlock[] {
  if (typeof document === 'undefined') {
    return [];
  }

  const template = document.createElement('template');
  template.innerHTML = `<div data-note-root>${html}</div>`;
  const root = template.content.firstElementChild;

  if (!root) {
    return [];
  }

  const blocks: ParsedBlock[] = [];
  let current: ParsedBlock | null = null;

  for (const child of Array.from(root.children)) {
    if (/^H[1-4]$/.test(child.tagName)) {
      if (current) {
        blocks.push(current);
      }

      current = {
        level: Number(child.tagName.slice(1)),
        title: (child.textContent ?? '').trim(),
        content: ''
      };

      continue;
    }

    if (!current) {
      continue;
    }

    if (child.matches('[data-type="table-of-contents"]')) {
      continue;
    }

    current.content += child.outerHTML;
  }

  if (current) {
    blocks.push({ ...current, content: current.content.trim() || '<p></p>' });
  }

  return blocks.filter((block) => block.title);
}

export function buildNoteCourseStructure(params: {
  noteTitle: string;
  noteContent: string;
  useSections: boolean;
  useTableOfContents: boolean;
}): NoteCourseStructureDraft {
  const blocks = splitHtmlByHeadings(params.noteContent);
  const courseTitle = params.noteTitle.trim() || 'Untitled course';

  if (blocks.length === 0) {
    const fallbackContent = params.noteContent.trim() || '<p></p>';

    return {
      courseTitle,
      sections: [],
      unsectionedLessons: [
        {
          id: createLessonId(),
          title: courseTitle,
          content: fallbackContent
        }
      ]
    };
  }

  if (!params.useSections) {
    return {
      courseTitle,
      sections: [],
      unsectionedLessons: blocks.map((block) => ({
        id: createLessonId(),
        title: block.title,
        content: block.content
      }))
    };
  }

  const sectionLevel = params.useTableOfContents ? 2 : 1;
  const sections: NoteCourseSectionDraft[] = [];
  const unsectionedLessons: NoteCourseLessonDraft[] = [];
  let currentSection: NoteCourseSectionDraft | null = null;

  for (const block of blocks) {
    const isSection = block.level <= sectionLevel;

    if (isSection) {
      currentSection = {
        id: createLessonId(),
        title: block.title,
        lessons: [
          {
            id: createLessonId(),
            title: block.title,
            content: block.content
          }
        ]
      };
      sections.push(currentSection);
      continue;
    }

    const lesson = {
      id: createLessonId(),
      title: block.title,
      content: block.content
    };

    if (currentSection) {
      currentSection.lessons.push(lesson);
    } else {
      unsectionedLessons.push(lesson);
    }
  }

  return {
    courseTitle,
    sections,
    unsectionedLessons
  };
}

export function flattenNoteCourseLessons(structure: NoteCourseStructureDraft) {
  return [...structure.unsectionedLessons, ...structure.sections.flatMap((section) => section.lessons)];
}

export function noteCourseStructureSummary(structure: NoteCourseStructureDraft) {
  return {
    sectionCount: structure.sections.length,
    lessonCount: flattenNoteCourseLessons(structure).length
  };
}

export function noteHasHeadings(noteContent: string) {
  return splitHtmlByHeadings(noteContent).length > 0;
}

export function noteContentPreview(noteContent: string) {
  if (typeof document === 'undefined') {
    return '';
  }

  const template = document.createElement('template');
  template.innerHTML = noteContent;
  const text = (template.content.textContent ?? '').replace(/\s+/g, ' ').trim();

  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}
