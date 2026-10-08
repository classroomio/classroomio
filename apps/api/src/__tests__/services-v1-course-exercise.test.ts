import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn(),
  isUserCourseMemberOrOrgAdmin: vi.fn()
}));
vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getOrganizationMemberRoleId: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn()
}));
vi.mock('@cio/core/services/course/course', () => ({ ensureProgramCourseAccess: vi.fn() }));
vi.mock('@cio/core/services/exercise/exercise', () => ({
  createExercise: vi.fn(),
  createExerciseFromTemplate: vi.fn(),
  deleteExerciseForCourseService: vi.fn(),
  getExercise: vi.fn(),
  listExercises: vi.fn(),
  resolveExerciseCourseId: vi.fn(),
  updateExerciseService: vi.fn()
}));
vi.mock('@cio/core/services/agent/usage', () => ({ isOrgOnPaidPlan: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseSectionById: vi.fn() }));
vi.mock('@cio/db/queries/exercise', () => ({
  getExerciseById: vi.fn(),
  getExerciseSectionOwnersByIds: vi.fn()
}));
vi.mock('@cio/db/queries/lesson', () => ({ getLessonById: vi.fn() }));
vi.mock('@cio/jobs', () => ({
  QUEUE_NAMES: { notifications: 'notifications' },
  JOB_NAMES: { notifications: { notifyCourseExercise: 'notify-course-exercise' } },
  getQueueJobMeta: vi.fn()
}));
vi.mock('@api/services/course/notify-exercise', () => ({
  getNotifyCourseExerciseStatusService: vi.fn(),
  notifyCourseExerciseService: vi.fn()
}));
vi.mock('@api/services/exercise/template', () => ({
  fetchAllTemplatesMetadata: vi.fn(),
  fetchTemplateById: vi.fn(),
  fetchTemplatesByTag: vi.fn()
}));

import { ROLE } from '@cio/utils/constants';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import {
  createExercise,
  createExerciseFromTemplate,
  deleteExerciseForCourseService,
  getExercise,
  listExercises,
  resolveExerciseCourseId,
  updateExerciseService
} from '@cio/core/services/exercise/exercise';
import { isOrgOnPaidPlan } from '@cio/core/services/agent/usage';
import { getCourseSectionById } from '@cio/db/queries/course';
import { getExerciseById, getExerciseSectionOwnersByIds } from '@cio/db/queries/exercise';
import { getLessonById } from '@cio/db/queries/lesson';
import { getQueueJobMeta } from '@cio/jobs';
import {
  getNotifyCourseExerciseStatusService,
  notifyCourseExerciseService
} from '@api/services/course/notify-exercise';
import { fetchTemplateById, fetchTemplatesByTag } from '@api/services/exercise/template';
import {
  createCourseExerciseService,
  deleteCourseExerciseService,
  getCourseExerciseNotifyStatusService,
  getCourseExerciseService,
  listCourseExercisesService,
  notifyCourseExerciseLearnersService,
  updateCourseExerciseService
} from '@api/services/v1/courses/exercises';
import { getExerciseTemplateService, listExerciseTemplatesService } from '@api/services/v1/exercise-templates/template';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';
const EXERCISE_ID = 'exercise-1';
const SECTION_ID = '44444444-4444-4444-8444-444444444444';
const params = { courseId: COURSE_ID };
const exerciseParams = { courseId: COURSE_ID, exerciseId: EXERCISE_ID };

const exerciseRow = (overrides: Record<string, unknown> = {}) =>
  ({
    id: EXERCISE_ID,
    courseId: COURSE_ID,
    sectionId: null,
    lessonId: null,
    title: 'Quiz',
    description: null,
    order: 1,
    slug: 'quiz',
    isUnlocked: true,
    dueBy: null,
    allowMultipleAttempts: false,
    sectionDisplayMode: 'one_question',
    completionPolicy: 'submitted',
    passThreshold: null,
    createdAt: 'now',
    updatedAt: 'now',
    ...overrides
  }) as never;

const exerciseDetail = () =>
  ({
    ...(exerciseRow() as object),
    questions: [
      {
        id: 10,
        name: 'q-10',
        title: 'Pick one',
        questionTypeId: 1,
        points: 2,
        order: 0,
        settings: {},
        exerciseSectionId: SECTION_ID,
        options: [
          { id: 100, label: 'A', value: 'v-a', isCorrect: true, settings: {} },
          { id: 101, label: 'B', value: 'v-b', isCorrect: false, settings: {} }
        ]
      }
    ],
    sections: [
      {
        id: SECTION_ID,
        title: 'Part 1',
        description: null,
        order: 0,
        colorTheme: 'blue',
        afterBehavior: { action: 'continue' },
        questions: [{ id: 10 }]
      }
    ]
  }) as never;

const question = (overrides: Record<string, unknown> = {}) => ({
  question: 'Pick one',
  questionTypeId: 1 as const,
  points: 1,
  ...overrides
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
  vi.mocked(getExerciseById).mockResolvedValue(exerciseRow());
  vi.mocked(resolveExerciseCourseId).mockResolvedValue(COURSE_ID);
  vi.mocked(getExercise).mockResolvedValue(exerciseDetail());
  vi.mocked(isOrgOnPaidPlan).mockResolvedValue(true);
  vi.mocked(getExerciseSectionOwnersByIds).mockResolvedValue([]);
});

describe('access rules', () => {
  it('returns 404 for a course in another organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('org-2');

    await expect(listCourseExercisesService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(listExercises).not.toHaveBeenCalled();
  });

  it('returns 401 without an actor', async () => {
    await expect(listCourseExercisesService(ORG_ID, null, params, { page: 1, limit: 20 })).rejects.toMatchObject({
      statusCode: 401
    });
  });

  it('returns 403 for reads and writes when the actor is not course team, as a student would be', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(getCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams)).rejects.toMatchObject({ statusCode: 403 });
    await expect(updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, { title: 'New' })).rejects.toMatchObject(
      { statusCode: 403 }
    );
    expect(updateExerciseService).not.toHaveBeenCalled();
  });

  it('returns 404 for an exercise that belongs to another course', async () => {
    vi.mocked(resolveExerciseCourseId).mockResolvedValue('course-2');

    await expect(getCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams)).rejects.toMatchObject({ statusCode: 404 });
    await expect(updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, { title: 'New' })).rejects.toMatchObject(
      { statusCode: 404 }
    );
    expect(updateExerciseService).not.toHaveBeenCalled();
  });

  it('returns 404 for an exercise that does not exist', async () => {
    vi.mocked(getExerciseById).mockResolvedValue(null as never);

    await expect(getCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('listCourseExercisesService', () => {
  it('sorts by order, pages the list, and maps the public shape', async () => {
    vi.mocked(listExercises).mockResolvedValue([
      { ...(exerciseRow({ id: 'b', order: 2 }) as object), isComplete: false },
      { ...(exerciseRow({ id: 'a', order: 1 }) as object), isComplete: false },
      { ...(exerciseRow({ id: 'c', order: 2 }) as object), isComplete: false }
    ] as never);

    const result = await listCourseExercisesService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 2 });

    expect(listExercises).toHaveBeenCalledWith(COURSE_ID, { sectionId: undefined, lessonId: undefined });
    expect(result.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result.items[0]).not.toHaveProperty('isComplete');
    expect(result.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });
});

describe('createCourseExerciseService', () => {
  it('creates in the course from the path with the given questions', async () => {
    vi.mocked(createExercise).mockResolvedValue(exerciseDetail());

    const result = await createCourseExerciseService(ORG_ID, ACTOR_ID, params, {
      title: 'Quiz',
      order: 1,
      questions: [question()]
    });

    expect(createExercise).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: COURSE_ID, title: 'Quiz', order: 1, questions: [question()] })
    );
    expect(result.questions[0]).toMatchObject({ id: 10, question: 'Pick one', options: [{ id: 100 }, { id: 101 }] });
    expect(result.sections[0]).toMatchObject({ id: SECTION_ID, questionIds: [10] });
  });

  it('returns 404 for a section from another course', async () => {
    vi.mocked(getCourseSectionById).mockResolvedValue({ id: SECTION_ID, courseId: 'course-2' } as never);

    await expect(
      createCourseExerciseService(ORG_ID, ACTOR_ID, params, { title: 'Quiz', order: 1, sectionId: SECTION_ID })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(createExercise).not.toHaveBeenCalled();
  });

  it('returns 404 for a lesson from another course', async () => {
    vi.mocked(getLessonById).mockResolvedValue({ id: 'lesson-1', courseId: 'course-2' } as never);

    await expect(
      createCourseExerciseService(ORG_ID, ACTOR_ID, params, { title: 'Quiz', order: 1, lessonId: 'lesson-1' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('refuses premium question types on the free plan', async () => {
    vi.mocked(isOrgOnPaidPlan).mockResolvedValue(false);

    await expect(
      createCourseExerciseService(ORG_ID, ACTOR_ID, params, {
        title: 'Quiz',
        order: 1,
        questions: [question({ questionTypeId: 8 })]
      })
    ).rejects.toMatchObject({ statusCode: 403, code: 'UPGRADE_REQUIRED' });
    expect(createExercise).not.toHaveBeenCalled();
  });

  it('creates from a template, checking its question types', async () => {
    const template = {
      id: 4,
      questionnaire: { questions: [{ title: 'Q', question_type: { id: 1 }, options: [], points: 1, order: 0 }] }
    };
    vi.mocked(fetchTemplateById).mockResolvedValue(template as never);
    vi.mocked(createExerciseFromTemplate).mockResolvedValue(exerciseDetail());

    await createCourseExerciseService(ORG_ID, ACTOR_ID, params, { order: 2, templateId: 4 });

    expect(createExerciseFromTemplate).toHaveBeenCalledWith(COURSE_ID, undefined, undefined, 2, template);
    expect(createExercise).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown template', async () => {
    vi.mocked(fetchTemplateById).mockResolvedValue(undefined);

    await expect(
      createCourseExerciseService(ORG_ID, ACTOR_ID, params, { order: 2, templateId: 99 })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('updateCourseExerciseService', () => {
  it.each([
    ['a question from another exercise', { questions: [question({ id: 999 })] }],
    [
      'an option from another question',
      { questions: [question({ id: 10, options: [{ id: 555, label: 'X', isCorrect: true }] })] }
    ],
    [
      'deleting an option from another question',
      { questions: [question({ id: 10, options: [{ id: 555, label: 'X', isCorrect: true, delete: true }] })] }
    ],
    [
      'an option id on a new question',
      { questions: [question({ options: [{ id: 100, label: 'A', isCorrect: true }] })] }
    ],
    [
      'a question pointed at a section the exercise does not have',
      { questions: [question({ id: 10, exerciseSectionId: 'other-section' })] }
    ]
  ])('returns 404 for %s without writing', async (_case, payload) => {
    await expect(updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, payload as never)).rejects.toMatchObject(
      {
        statusCode: 404
      }
    );
    expect(updateExerciseService).not.toHaveBeenCalled();
  });

  it('returns 404 for a section id that belongs to another exercise', async () => {
    const otherSection = '55555555-5555-4555-8555-555555555555';
    vi.mocked(getExerciseSectionOwnersByIds).mockResolvedValue([{ id: otherSection, exerciseId: 'exercise-2' }]);

    await expect(
      updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, {
        sections: [
          { id: otherSection, title: 'Stolen', order: 0, colorTheme: 'blue', afterBehavior: { action: 'continue' } }
        ]
      })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(updateExerciseService).not.toHaveBeenCalled();
  });

  it('accepts a new caller-made section id and maps delete flags to deletedAt', async () => {
    const newSection = '66666666-6666-4666-8666-666666666666';
    vi.mocked(updateExerciseService).mockResolvedValue(exerciseDetail());

    await updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, {
      sections: [
        { id: newSection, title: 'New part', order: 0, colorTheme: 'blue', afterBehavior: { action: 'continue' } }
      ],
      questions: [
        question({
          id: 10,
          exerciseSectionId: newSection,
          options: [
            { id: 100, label: 'A', isCorrect: true },
            { id: 101, label: 'B', isCorrect: false, delete: true },
            { label: 'C', isCorrect: false }
          ]
        }),
        question({ id: 10, delete: true })
      ]
    });

    const [, internal] = vi.mocked(updateExerciseService).mock.calls[0];
    expect(internal.questions?.[0].options?.[1].deletedAt).toEqual(expect.any(String));
    expect(internal.questions?.[0].options?.[0].deletedAt).toBeUndefined();
    expect(internal.questions?.[1].deletedAt).toEqual(expect.any(String));
    expect(internal.questions?.[0]).not.toHaveProperty('delete');
  });

  it.each([
    ['options left out', undefined, [100, 101]],
    ['only one option sent', [{ id: 101, label: 'B2', isCorrect: false }], [100, 101]],
    [
      'one option swapped for a new one',
      [
        { id: 101, label: 'B', isCorrect: false, delete: true },
        { label: 'C', isCorrect: false }
      ],
      [100, 101, undefined]
    ]
  ])('keeps the options the caller did not mention when %s', async (_case, options, expectedIds) => {
    vi.mocked(updateExerciseService).mockResolvedValue(exerciseDetail());

    await updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, {
      questions: [question({ id: 10, question: 'Pick one, reworded', options })]
    });

    const [, internal] = vi.mocked(updateExerciseService).mock.calls[0];
    const sent = internal.questions?.[0].options ?? [];
    expect(sent.map((option) => option.id)).toEqual(expectedIds);
    expect(sent[0]).toMatchObject({ id: 100, label: 'A', isCorrect: true });
    expect(sent[0].deletedAt).toBeUndefined();
  });

  it.each([
    ['only one option', [{ id: 101, label: 'B', isCorrect: false, delete: true }]],
    ['no correct option', [{ id: 100, label: 'A', isCorrect: false }]]
  ])('returns 400 when an option edit would leave the question with %s', async (_case, options) => {
    await expect(
      updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, { questions: [question({ id: 10, options })] })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(updateExerciseService).not.toHaveBeenCalled();
  });

  it('does not judge the options when an edit sends neither options nor a question type', async () => {
    vi.mocked(getExercise).mockResolvedValue({
      ...(exerciseDetail() as object),
      questions: [{ id: 10, title: 'Old', questionTypeId: 1, points: 1, order: 0, settings: {}, options: [] }]
    } as never);
    vi.mocked(updateExerciseService).mockResolvedValue(exerciseDetail());

    await updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, {
      questions: [{ id: 10, question: 'Reworded', points: 2 }]
    });

    expect(updateExerciseService).toHaveBeenCalled();
  });

  it('returns 400 when a removed section still holds a question', async () => {
    const newSection = '66666666-6666-4666-8666-666666666666';
    const sections = [
      {
        id: newSection,
        title: 'New part',
        order: 0,
        colorTheme: 'blue' as const,
        afterBehavior: { action: 'continue' as const }
      }
    ];

    await expect(updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, { sections })).rejects.toMatchObject({
      statusCode: 400
    });
    expect(updateExerciseService).not.toHaveBeenCalled();

    vi.mocked(updateExerciseService).mockResolvedValue(exerciseDetail());
    await updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, {
      sections,
      questions: [question({ id: 10, exerciseSectionId: newSection })]
    });
    await updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, {
      sections,
      questions: [question({ id: 10, delete: true })]
    });
    await updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, { sections: [] });
    expect(updateExerciseService).toHaveBeenCalledTimes(3);
  });

  it('checks premium types only on questions that are not being deleted', async () => {
    vi.mocked(isOrgOnPaidPlan).mockResolvedValue(false);
    vi.mocked(updateExerciseService).mockResolvedValue(exerciseDetail());

    await updateCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams, {
      questions: [question({ id: 10, questionTypeId: 8, delete: true })]
    });

    expect(updateExerciseService).toHaveBeenCalled();
  });
});

describe('getCourseExerciseService', () => {
  it('returns the exercise with its questions, options and sections', async () => {
    const result = await getCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams);

    expect(getExercise).toHaveBeenCalledWith(EXERCISE_ID);
    expect(result).toMatchObject({
      id: EXERCISE_ID,
      questions: [{ id: 10, exerciseSectionId: SECTION_ID, options: [{ id: 100, isCorrect: true }, { id: 101 }] }],
      sections: [{ id: SECTION_ID, questionIds: [10] }]
    });
  });
});

describe('notifyCourseExerciseLearnersService', () => {
  it('queues the dashboard notification job for the exercise', async () => {
    vi.mocked(notifyCourseExerciseService).mockResolvedValue({ jobId: 'job-1' });

    const result = await notifyCourseExerciseLearnersService(ORG_ID, ACTOR_ID, exerciseParams);

    expect(notifyCourseExerciseService).toHaveBeenCalledWith(COURSE_ID, EXERCISE_ID);
    expect(result).toEqual({ jobId: 'job-1' });
  });
});

describe('deleteCourseExerciseService', () => {
  it('deletes through the course-scoped core service', async () => {
    vi.mocked(deleteExerciseForCourseService).mockResolvedValue(exerciseRow());

    const result = await deleteCourseExerciseService(ORG_ID, ACTOR_ID, exerciseParams);

    expect(deleteExerciseForCourseService).toHaveBeenCalledWith(COURSE_ID, EXERCISE_ID);
    expect(result.id).toBe(EXERCISE_ID);
  });
});

describe('getCourseExerciseNotifyStatusService', () => {
  const notifyParams = { ...exerciseParams, jobId: 'job-1' };

  it.each([
    ['a missing job', null],
    ['another course', { name: 'notify-course-exercise', data: { courseId: 'course-2', exerciseId: EXERCISE_ID } }],
    [
      'another exercise in the same course',
      { name: 'notify-course-exercise', data: { courseId: COURSE_ID, exerciseId: 'exercise-2' } }
    ],
    ['a job queued without an exercise id', { name: 'notify-course-exercise', data: { courseId: COURSE_ID } }],
    ['another job type', { name: 'notify-course-session-update', data: { courseId: COURSE_ID } }]
  ])('returns 404 for %s', async (_case, job) => {
    vi.mocked(getQueueJobMeta).mockResolvedValue(job);

    await expect(
      getCourseExerciseNotifyStatusService(ORG_ID, ACTOR_ID, notifyParams, { pollCount: 0 })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(getNotifyCourseExerciseStatusService).not.toHaveBeenCalled();
  });

  it("returns this exercise's job status", async () => {
    vi.mocked(getQueueJobMeta).mockResolvedValue({
      name: 'notify-course-exercise',
      data: { courseId: COURSE_ID, exerciseId: EXERCISE_ID }
    });
    vi.mocked(getNotifyCourseExerciseStatusService).mockResolvedValue({
      job: { id: 'job-1', status: 'completed', createdAt: 'a', updatedAt: 'b', error: null },
      nextPollMs: 0
    } as never);

    const result = await getCourseExerciseNotifyStatusService(ORG_ID, ACTOR_ID, notifyParams, { pollCount: 2 });

    expect(getNotifyCourseExerciseStatusService).toHaveBeenCalledWith('job-1', 2);
    expect(result).toEqual({
      jobId: 'job-1',
      status: 'completed',
      createdAt: 'a',
      updatedAt: 'b',
      error: null,
      nextPollMs: 0
    });
  });
});

describe('exercise template services', () => {
  it('returns 403 when the actor is not an org admin or tutor', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.STUDENT);

    await expect(listExerciseTemplatesService(ORG_ID, ACTOR_ID, { page: 1, limit: 20 })).rejects.toMatchObject({
      statusCode: 403
    });
  });

  it('lists templates by tag', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);
    vi.mocked(fetchTemplatesByTag).mockResolvedValue([
      { id: 2, title: 'B', description: null, questions: 3, points: 6, tag: 'math' },
      { id: 1, title: 'A', description: null, questions: 1, points: 1, tag: 'math' }
    ] as never);

    const result = await listExerciseTemplatesService(ORG_ID, ACTOR_ID, { page: 1, limit: 20, tag: 'math' });

    expect(result.items.map((item) => item.id)).toEqual([1, 2]);
    expect(result.items[1]).toMatchObject({ questionCount: 3, points: 6 });
  });

  it('returns 404 for an unknown template', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(fetchTemplateById).mockResolvedValue(undefined);

    await expect(getExerciseTemplateService(ORG_ID, ACTOR_ID, { templateId: 9 })).rejects.toMatchObject({
      statusCode: 404
    });
  });
});
