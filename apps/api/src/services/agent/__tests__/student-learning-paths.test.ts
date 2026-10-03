import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getLearnerPathSummaries: vi.fn(),
  trackAgentEvent: vi.fn()
}));

vi.mock('@cio/db/queries/learning-path/journey', () => ({
  getLearnerPathSummaries: mocks.getLearnerPathSummaries
}));

vi.mock('@cio/core/utils/tinybird', () => ({
  trackAgentEvent: mocks.trackAgentEvent,
  AgentEvent: { TOOL_CALLED: 'tool_called', TOOL_COMPLETED: 'tool_completed' }
}));

import { buildStudentAgentTools } from '../student-tools';

describe('get_student_learning_paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns enrolled paths with progress and the current course', async () => {
    mocks.getLearnerPathSummaries.mockResolvedValue([
      {
        pathId: 'path-1',
        publicId: 'AbC123Xy',
        name: 'Path One',
        memberStatus: 'IN_PROGRESS',
        courses: [
          { courseId: 'c-1', title: 'First', order: 0, isComplete: true },
          { courseId: 'c-2', title: 'Second', order: 1, isComplete: false }
        ]
      }
    ]);

    const tools = buildStudentAgentTools('org-1', 'student-1', 'course-9', {} as never);
    const execute = tools.get_student_learning_paths.execute as (args: { limit?: number }) => Promise<unknown>;
    const result = (await execute({ limit: 5 })) as {
      paths: Array<{
        pathId: string;
        progressPercent: number;
        currentCourseId: string | null;
        courses: Array<{ courseId: string; isComplete: boolean }>;
      }>;
    };

    expect(mocks.getLearnerPathSummaries).toHaveBeenCalledWith({ orgId: 'org-1', profileId: 'student-1', limit: 5 });
    expect(result.paths).toHaveLength(1);
    expect(result.paths[0]).toMatchObject({
      pathId: 'path-1',
      progressPercent: 50,
      currentCourseId: 'c-2'
    });
    expect(mocks.trackAgentEvent).toHaveBeenCalled();
  });

  it('returns no paths when the student is not enrolled anywhere', async () => {
    mocks.getLearnerPathSummaries.mockResolvedValue([]);

    const tools = buildStudentAgentTools('org-1', 'student-1', 'course-9', {} as never);
    const execute = tools.get_student_learning_paths.execute as (args: { limit?: number }) => Promise<unknown>;
    const result = (await execute({})) as { paths: unknown[] };

    expect(result).toEqual({ paths: [] });
  });

  it('currentCourseId falls back to the last course when all are complete', async () => {
    mocks.getLearnerPathSummaries.mockResolvedValue([
      {
        pathId: 'path-1',
        publicId: 'AbC123Xy',
        name: 'Path One',
        memberStatus: 'COMPLETED',
        courses: [
          { courseId: 'c-1', title: 'First', order: 0, isComplete: true },
          { courseId: 'c-2', title: 'Second', order: 1, isComplete: true }
        ]
      }
    ]);

    const tools = buildStudentAgentTools('org-1', 'student-1', 'course-9', {} as never);
    const execute = tools.get_student_learning_paths.execute as (args: { limit?: number }) => Promise<unknown>;
    const result = (await execute({})) as {
      paths: Array<{ currentCourseId: string | null; progressPercent: number }>;
    };

    expect(result.paths[0]).toMatchObject({ currentCourseId: 'c-2', progressPercent: 100 });
  });

  it('reports progress and the current course from the path courses', async () => {
    const courses = [
      { courseId: 'c-1', title: 'First', order: 0, isComplete: true },
      { courseId: 'c-2', title: 'Second', order: 1, isComplete: false },
      { courseId: 'c-3', title: 'Third', order: 2, isComplete: false }
    ];
    mocks.getLearnerPathSummaries.mockResolvedValue([
      {
        pathId: 'path-1',
        publicId: 'AbC123Xy',
        name: 'Path One',
        memberStatus: 'IN_PROGRESS',
        courses
      }
    ]);

    const tools = buildStudentAgentTools('org-1', 'student-1', 'course-9', {} as never);
    const execute = tools.get_student_learning_paths.execute as (args: { limit?: number }) => Promise<unknown>;
    const result = (await execute({})) as {
      paths: Array<{ progressPercent: number; currentCourseId: string | null }>;
    };

    // Fixed values: the DB-backed parity with the journey service lives in
    // learner-path-summaries.integration.test.ts.
    expect(result.paths[0].progressPercent).toBe(33);
    expect(result.paths[0].currentCourseId).toBe('c-2');
  });
});
