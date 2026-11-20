import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCourseStudentMemberIds: vi.fn(),
  replaceExerciseAssignments: vi.fn(),
  getCoursePracticeQuestionIds: vi.fn(),
  getQuestionSkillIds: vi.fn(),
  getSkillById: vi.fn(),
  replaceQuestionSkills: vi.fn(),
  getQuestionsWithOptionsByIds: vi.fn(),
  getCourseContentItems: vi.fn(),
  createExercise: vi.fn(),
  getExercise: vi.fn(),
  deleteExerciseService: vi.fn()
}));

vi.mock('@cio/db/queries/exercise', () => ({
  getCourseStudentMemberIds: mocks.getCourseStudentMemberIds,
  replaceExerciseAssignments: mocks.replaceExerciseAssignments
}));
vi.mock('@cio/db/queries/skill', () => ({
  getCoursePracticeQuestionIds: mocks.getCoursePracticeQuestionIds,
  getQuestionSkillIds: mocks.getQuestionSkillIds,
  getSkillById: mocks.getSkillById,
  replaceQuestionSkills: mocks.replaceQuestionSkills
}));
vi.mock('@cio/db/queries/analytics', () => ({ getQuestionsWithOptionsByIds: mocks.getQuestionsWithOptionsByIds }));
vi.mock('@cio/db/queries/course/content', () => ({ getCourseContentItems: mocks.getCourseContentItems }));
vi.mock('@cio/core/services/exercise/exercise', () => ({
  createExercise: mocks.createExercise,
  getExercise: mocks.getExercise,
  deleteExerciseService: mocks.deleteExerciseService
}));

import { createPracticeSetService } from '@api/services/practice/practice';

const parameterised = {
  id: 1,
  title: 'Compute $\\frac{{{b}}}{{{a}}}$',
  questionTypeId: 17,
  points: 2,
  options: [],
  settings: {
    acceptedAnswers: ['{{answer}}'],
    parameters: {
      variables: [
        { name: 'a', type: 'int', min: 2, max: 9, step: 1 },
        { name: 'b', type: 'int', min: 1, max: 20, step: 1 }
      ],
      constraints: [],
      answerFormula: 'b / a'
    }
  }
};

describe('createPracticeSetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourseStudentMemberIds.mockImplementation(
      async (_courseId: string, profileIds: string[]) =>
        new Map(profileIds.filter((id) => id !== 'p9').map((id) => [id, 'm' + id.slice(1)]))
    );
    mocks.getSkillById.mockResolvedValue({ id: 'skill-1' });
    mocks.getCoursePracticeQuestionIds.mockResolvedValue([1]);
    mocks.getQuestionsWithOptionsByIds.mockResolvedValue([parameterised]);
    mocks.getQuestionSkillIds.mockResolvedValue(new Map([[1, ['skill-1']]]));
    mocks.getCourseContentItems.mockResolvedValue([{ type: 'exercise', order: 4, sectionId: 'sec-1' }]);
    mocks.createExercise.mockResolvedValue({ id: 'ex-1', title: 'Practice' });
    mocks.getExercise.mockResolvedValue({ questions: [0, 1, 2].map((order) => ({ id: 100 + order, order })) });
  });

  it('expands a parameterised question into fixed variants and assigns only the chosen students', async () => {
    const result = await createPracticeSetService('course-1', 'org-1', {
      skillId: 'skill-1',
      profileIds: ['p1', 'p2'],
      count: 3
    });

    const created = mocks.createExercise.mock.calls[0][0];
    expect(created.questions).toHaveLength(3);
    expect(created.questions.every((question: { settings: object }) => !('parameters' in question.settings))).toBe(
      true
    );
    expect(new Set(created.questions.map((question: { question: string }) => question.question)).size).toBe(3);
    expect(created.order).toBe(5);
    expect(mocks.replaceExerciseAssignments).toHaveBeenCalledWith('ex-1', ['m1', 'm2']);
    expect(mocks.replaceQuestionSkills).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({ exerciseId: 'ex-1', questionCount: 3, assignedCount: 2 });
  });

  it('refuses profiles that are not students of the course', async () => {
    await expect(
      createPracticeSetService('course-1', 'org-1', { skillId: 'skill-1', profileIds: ['p1', 'p9'], count: 3 })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.createExercise).not.toHaveBeenCalled();
  });

  it('deletes the exercise when the assignment cannot be saved so it never reaches everyone', async () => {
    mocks.replaceExerciseAssignments.mockRejectedValue(new Error('db down'));

    await expect(
      createPracticeSetService('course-1', 'org-1', { skillId: 'skill-1', profileIds: ['p1'], count: 2 })
    ).rejects.toThrow('db down');
    expect(mocks.deleteExerciseService).toHaveBeenCalledWith('ex-1');
  });

  it('fails when nothing in the course can become practice', async () => {
    mocks.getCoursePracticeQuestionIds.mockResolvedValue([]);
    mocks.getQuestionsWithOptionsByIds.mockResolvedValue([]);

    await expect(
      createPracticeSetService('course-1', 'org-1', { skillId: 'skill-1', profileIds: ['p1'], count: 2 })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
