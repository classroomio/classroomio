/**
 * Characterization fixtures for the SCORM activity platform (PR 0c).
 *
 * Builders for five courses with no activities, plus two students with
 * partial progress and one student with a certificate. All outputs below
 * describe today's behaviour: lessons + exercises only, shared order space
 * per section, no activity rows.
 *
 * The pure builders return plain objects used by dashboard utility tests
 * and mocked service tests. Database tests insert equivalent rows through
 * `seedCourseContentFixture` inside a rollback transaction so CI stays clean.
 */

export type FixtureSection = {
  id: string;
  title: string;
  order: number;
};

export type FixtureLesson = {
  id: string;
  title: string;
  order: number;
  sectionId: string | null;
  isUnlocked: boolean;
  slug: string;
  note: string;
};

export type FixtureExercise = {
  id: string;
  title: string;
  order: number;
  sectionId: string | null;
  lessonId: string | null;
  isUnlocked: boolean;
  slug: string;
  questionCount: number;
};

export type FixtureCourseKind = 'grouped' | 'ungrouped' | 'compliance' | 'template-derived' | 'sequential-locks';

export type FixtureCourse = {
  kind: FixtureCourseKind;
  title: string;
  type: 'SELF_PACED' | 'COMPLIANCE';
  isContentGroupingEnabled: boolean;
  progressionMode: 'free' | 'sequential';
  sections: FixtureSection[];
  lessons: FixtureLesson[];
  exercises: FixtureExercise[];
  certificate: {
    threshold: number;
    requiredExerciseId: string | null;
    isDownloadable: boolean;
    deadline: string | null;
  } | null;
  templateId: string | null;
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildGroupedCourse(): FixtureCourse {
  const sectionA = { id: 'section-grouped-a', title: 'Getting started', order: 1 };
  const sectionB = { id: 'section-grouped-b', title: 'Core skills', order: 2 };

  return {
    kind: 'grouped',
    title: 'Grouped course',
    type: 'SELF_PACED',
    isContentGroupingEnabled: true,
    progressionMode: 'free',
    sections: [sectionA, sectionB],
    lessons: [
      {
        id: 'lesson-grouped-intro',
        title: 'Welcome',
        order: 1,
        sectionId: sectionA.id,
        isUnlocked: true,
        slug: slugify('Welcome'),
        note: '<p>Welcome to the course.</p>'
      },
      {
        id: 'lesson-grouped-core',
        title: 'Core lesson',
        order: 2,
        sectionId: sectionB.id,
        isUnlocked: true,
        slug: slugify('Core lesson'),
        note: '<p>Core content.</p>'
      }
    ],
    exercises: [
      {
        id: 'exercise-grouped-quiz',
        title: 'Starter quiz',
        order: 3,
        sectionId: sectionB.id,
        lessonId: null,
        isUnlocked: true,
        slug: slugify('Starter quiz'),
        questionCount: 2
      }
    ],
    certificate: null,
    templateId: null
  };
}

export function buildUngroupedCourse(): FixtureCourse {
  return {
    kind: 'ungrouped',
    title: 'Ungrouped course',
    type: 'SELF_PACED',
    isContentGroupingEnabled: false,
    progressionMode: 'free',
    sections: [],
    lessons: [
      {
        id: 'lesson-ungrouped-one',
        title: 'First lesson',
        order: 1,
        sectionId: null,
        isUnlocked: true,
        slug: slugify('First lesson'),
        note: '<p>First.</p>'
      },
      {
        id: 'lesson-ungrouped-two',
        title: 'Second lesson',
        order: 2,
        sectionId: null,
        isUnlocked: true,
        slug: slugify('Second lesson'),
        note: '<p>Second.</p>'
      }
    ],
    exercises: [
      {
        id: 'exercise-ungrouped-check',
        title: 'Quick check',
        order: 3,
        sectionId: null,
        lessonId: null,
        isUnlocked: true,
        slug: slugify('Quick check'),
        questionCount: 1
      }
    ],
    certificate: null,
    templateId: null
  };
}

export function buildComplianceCourse(): FixtureCourse {
  const section = { id: 'section-compliance-main', title: 'Compliance', order: 1 };

  return {
    kind: 'compliance',
    title: 'Compliance course',
    type: 'COMPLIANCE',
    isContentGroupingEnabled: true,
    progressionMode: 'free',
    sections: [section],
    lessons: [
      {
        id: 'lesson-compliance-policy',
        title: 'Policy overview',
        order: 1,
        sectionId: section.id,
        isUnlocked: true,
        slug: slugify('Policy overview'),
        note: '<p>Read the policy.</p>'
      }
    ],
    exercises: [
      {
        id: 'exercise-compliance-final',
        title: 'Final assessment',
        order: 2,
        sectionId: section.id,
        lessonId: null,
        isUnlocked: true,
        slug: slugify('Final assessment'),
        questionCount: 3
      }
    ],
    certificate: {
      threshold: 100,
      requiredExerciseId: 'exercise-compliance-final',
      isDownloadable: true,
      deadline: '2027-12-31T23:59:00.000Z'
    },
    templateId: null
  };
}

export function buildTemplateDerivedCourse(): FixtureCourse {
  const section = { id: 'section-template-main', title: 'Template section', order: 1 };

  return {
    kind: 'template-derived',
    title: 'Template-derived course',
    type: 'SELF_PACED',
    isContentGroupingEnabled: true,
    progressionMode: 'free',
    sections: [section],
    lessons: [
      {
        id: 'lesson-template-intro',
        title: 'Template lesson',
        order: 1,
        sectionId: section.id,
        isUnlocked: true,
        slug: slugify('Template lesson'),
        note: '<p>From template.</p>'
      }
    ],
    exercises: [
      {
        id: 'exercise-template-quiz',
        title: 'Template quiz',
        order: 2,
        sectionId: section.id,
        lessonId: null,
        isUnlocked: true,
        slug: slugify('Template quiz'),
        questionCount: 2
      }
    ],
    certificate: null,
    templateId: 'template-platform-onboarding'
  };
}

export function buildSequentialLocksCourse(): FixtureCourse {
  const section = { id: 'section-locks-main', title: 'Locked path', order: 1 };

  return {
    kind: 'sequential-locks',
    title: 'Sequential locks course',
    type: 'SELF_PACED',
    isContentGroupingEnabled: true,
    progressionMode: 'sequential',
    sections: [section],
    lessons: [
      {
        id: 'lesson-locks-first',
        title: 'Step one',
        order: 1,
        sectionId: section.id,
        isUnlocked: true,
        slug: slugify('Step one'),
        note: '<p>Step one.</p>'
      },
      {
        id: 'lesson-locks-second',
        title: 'Step two',
        order: 2,
        sectionId: section.id,
        isUnlocked: false,
        slug: slugify('Step two'),
        note: '<p>Step two.</p>'
      }
    ],
    exercises: [
      {
        id: 'exercise-locks-final',
        title: 'Locked quiz',
        order: 3,
        sectionId: section.id,
        lessonId: null,
        isUnlocked: false,
        slug: slugify('Locked quiz'),
        questionCount: 1
      }
    ],
    certificate: null,
    templateId: null
  };
}

export function buildAllFixtureCourses(): FixtureCourse[] {
  return [
    buildGroupedCourse(),
    buildUngroupedCourse(),
    buildComplianceCourse(),
    buildTemplateDerivedCourse(),
    buildSequentialLocksCourse()
  ];
}

export type FixtureStudentProgress = {
  profileId: string;
  email: string;
  completedLessonIds: string[];
  submittedExerciseIds: string[];
  certificateEarnedAt: string | null;
};

export function buildPartialProgressStudents(): FixtureStudentProgress[] {
  return [
    {
      profileId: 'profile-partial-one',
      email: 'partial-one@characterization.test',
      completedLessonIds: ['lesson-grouped-intro'],
      submittedExerciseIds: ['exercise-grouped-quiz'],
      certificateEarnedAt: null
    },
    {
      profileId: 'profile-partial-two',
      email: 'partial-two@characterization.test',
      completedLessonIds: [],
      submittedExerciseIds: [],
      certificateEarnedAt: null
    },
    {
      profileId: 'profile-certified',
      email: 'certified@characterization.test',
      completedLessonIds: ['lesson-grouped-intro', 'lesson-grouped-core'],
      submittedExerciseIds: ['exercise-grouped-quiz'],
      certificateEarnedAt: '2026-09-01T00:00:00.000Z'
    }
  ];
}

export type DashboardFixtureItem = {
  id: string;
  type: 'SECTION' | 'LESSON' | 'EXERCISE';
  title: string;
  order: number;
  sectionId: string | null;
  isUnlocked: boolean;
  isComplete: boolean;
  slug?: string;
};

/**
 * Dashboard `Course` shape for a fixture: grouped courses expose sections,
 * ungrouped courses expose a flat item list. Mirrors today's
 * `buildCourseContent` output for zero-activity courses.
 */
export function toDashboardCourse(fixture: FixtureCourse, completedLessonIds: string[] = []) {
  const completed = new Set(completedLessonIds);
  const items: DashboardFixtureItem[] = [
    ...fixture.lessons.map((lesson) => ({
      id: lesson.id,
      type: 'LESSON' as const,
      title: lesson.title,
      order: lesson.order,
      sectionId: lesson.sectionId,
      isUnlocked: lesson.isUnlocked,
      isComplete: completed.has(lesson.id),
      slug: lesson.slug
    })),
    ...fixture.exercises.map((exercise) => ({
      id: exercise.id,
      type: 'EXERCISE' as const,
      title: exercise.title,
      order: exercise.order,
      sectionId: exercise.sectionId,
      isUnlocked: exercise.isUnlocked,
      isComplete: false,
      slug: exercise.slug
    }))
  ];

  if (!fixture.isContentGroupingEnabled) {
    return {
      id: `course-${fixture.kind}`,
      title: fixture.title,
      type: fixture.type,
      content: {
        grouped: false as const,
        sections: [],
        items: [...items].sort((a, b) => a.order - b.order)
      }
    };
  }

  const sections = fixture.sections.map((section) => ({
    id: section.id,
    title: section.title,
    order: section.order,
    items: items.filter((item) => item.sectionId === section.id).sort((a, b) => a.order - b.order)
  }));

  return {
    id: `course-${fixture.kind}`,
    title: fixture.title,
    type: fixture.type,
    content: {
      grouped: true as const,
      sections,
      items: []
    }
  };
}
