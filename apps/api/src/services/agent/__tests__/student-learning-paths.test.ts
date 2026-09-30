import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getEnrolledPaths: vi.fn(),
  listLearningPathCourses: vi.fn(),
  getCourseCompletionStatsForProfile: vi.fn(),
  trackAgentEvent: vi.fn()
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  getEnrolledPaths: mocks.getEnrolledPaths,
  listLearningPathCourses: mocks.listLearningPathCourses,
  getCourseCompletionStatsForProfile: mocks.getCourseCompletionStatsForProfile
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
    mocks.getEnrolledPaths.mockResolvedValue([
      {
        member: { id: 'm-1', status: 'IN_PROGRESS' },
        learningPath: { id: 'path-1', publicId: 'AbC123Xy', organizationId: 'org-1', name: 'Path One' }
      }
    ]);
    mocks.listLearningPathCourses.mockResolvedValue([
      { id: 'pc-1', courseId: 'c-1', title: 'First', order: 0 },
      { id: 'pc-2', courseId: 'c-2', title: 'Second', order: 1 }
    ]);
    mocks.getCourseCompletionStatsForProfile
      .mockResolvedValueOnce({ isComplete: true })
      .mockResolvedValueOnce({ isComplete: false });

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

    expect(mocks.getEnrolledPaths).toHaveBeenCalledWith('student-1', 'org-1');
    expect(result.paths).toHaveLength(1);
    expect(result.paths[0]).toMatchObject({
      pathId: 'path-1',
      progressPercent: 50,
      currentCourseId: 'c-2'
    });
    expect(mocks.trackAgentEvent).toHaveBeenCalled();
  });

  it('returns no paths when the student is not enrolled anywhere', async () => {
    mocks.getEnrolledPaths.mockResolvedValue([]);

    const tools = buildStudentAgentTools('org-1', 'student-1', 'course-9', {} as never);
    const execute = tools.get_student_learning_paths.execute as (args: { limit?: number }) => Promise<unknown>;
    const result = (await execute({})) as { paths: unknown[] };

    expect(result).toEqual({ paths: [] });
    expect(mocks.listLearningPathCourses).not.toHaveBeenCalled();
  });
});
