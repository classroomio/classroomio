import { describe, expect, it } from 'vitest';
import { getDraftRootEntries, ZCourseImportDraftPayload } from '../src/validation/course-import/course-import';

const course = { title: 'Pandas', description: 'Data analysis', type: 'SELF_PACED' as const };
const lessonLanguages = [
  { lessonExternalId: 'intro', locale: 'en' as const, content: '<p>Intro</p>' },
  { lessonExternalId: 'cleaning', locale: 'en' as const, content: '<p>Cleaning</p>' }
];

describe('course import draft outline', () => {
  it('keeps a standalone lesson in its top-level position among sections and exercises', () => {
    const draft = {
      sections: [{ externalId: 'projects', title: 'Projects', order: 2 }],
      lessons: [
        { externalId: 'intro', title: 'Intro', order: 1 },
        { externalId: 'cleaning', sectionExternalId: 'projects', title: 'Cleaning', order: 1 }
      ],
      exercises: [{ externalId: 'quiz', title: 'Quiz', order: 3 }]
    };

    expect(getDraftRootEntries(draft)).toEqual([
      { kind: 'lesson', externalId: 'intro', order: 1 },
      { kind: 'section', externalId: 'projects', order: 2 },
      { kind: 'exercise', externalId: 'quiz', order: 3 }
    ]);
  });

  it('places separately numbered top-level exercises after the sections', () => {
    const draft = {
      sections: [
        { externalId: 'basics', title: 'Basics', order: 1 },
        { externalId: 'projects', title: 'Projects', order: 2 }
      ],
      lessons: [{ externalId: 'intro', sectionExternalId: 'basics', title: 'Intro', order: 1 }],
      exercises: [
        { externalId: 'quiz', title: 'Quiz', order: 1 },
        { externalId: 'exam', title: 'Exam', order: 2 }
      ]
    };

    expect(getDraftRootEntries(draft)?.map((entry) => [entry.externalId, entry.order])).toEqual([
      ['basics', 1],
      ['projects', 2],
      ['quiz', 3],
      ['exam', 4]
    ]);
  });

  it('rejects top-level orders that skip or repeat a position', () => {
    const result = ZCourseImportDraftPayload.safeParse({
      course,
      sections: [{ externalId: 'projects', title: 'Projects', order: 1 }],
      lessons: [
        { externalId: 'intro', title: 'Intro', order: 1 },
        { externalId: 'cleaning', sectionExternalId: 'projects', title: 'Cleaning', order: 1 }
      ],
      lessonLanguages
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('Top-level orders');
  });

  it('accepts a draft whose lessons all sit outside sections', () => {
    const result = ZCourseImportDraftPayload.safeParse({
      course,
      lessons: [
        { externalId: 'intro', title: 'Intro', order: 1 },
        { externalId: 'cleaning', title: 'Cleaning', order: 2 }
      ],
      lessonLanguages
    });

    expect(result.success).toBe(true);
  });
});
