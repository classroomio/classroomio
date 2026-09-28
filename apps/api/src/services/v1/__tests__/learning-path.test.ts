import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  resolveLearningPath: vi.fn(),
  listOrgLearningPaths: vi.fn(),
  getLearningPathDetail: vi.fn(),
  createLearningPathService: vi.fn(),
  updateLearningPathService: vi.fn(),
  deleteLearningPathService: vi.fn(),
  listLearningPathMembers: vi.fn(),
  addCoursesToPathService: vi.fn(),
  removeCourseFromPathService: vi.fn(),
  reorderPathCoursesService: vi.fn(),
  listLearningPathCourses: vi.fn()
}));

vi.mock('@api/services/learning-path/learning-path', () => ({
  resolveLearningPath: mocks.resolveLearningPath,
  listOrgLearningPaths: mocks.listOrgLearningPaths,
  getLearningPathDetail: mocks.getLearningPathDetail,
  createLearningPathService: mocks.createLearningPathService,
  updateLearningPathService: mocks.updateLearningPathService,
  deleteLearningPathService: mocks.deleteLearningPathService
}));

vi.mock('@api/services/learning-path/course-management', () => ({
  addCoursesToPathService: mocks.addCoursesToPathService,
  removeCourseFromPathService: mocks.removeCourseFromPathService,
  reorderPathCoursesService: mocks.reorderPathCoursesService
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  listLearningPathCourses: mocks.listLearningPathCourses,
  listLearningPathMembers: mocks.listLearningPathMembers
}));

import {
  addCoursesToPublicApiLearningPathService,
  createPublicApiLearningPathService,
  deletePublicApiLearningPathService,
  getLearningPathService,
  listLearningPathsService,
  listPublicApiLearningPathStudentsService,
  removeCourseFromPublicApiPathService,
  reorderPublicApiPathCoursesService,
  updatePublicApiLearningPathService
} from '../learning-path';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const PATH_ID = '22222222-2222-2222-2222-222222222222';

describe('v1 learning path services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveLearningPath.mockResolvedValue({ id: PATH_ID, organizationId: ORG_ID, name: 'Path' });
  });

  it('lists paths scoped to the authenticated organization', async () => {
    mocks.listOrgLearningPaths.mockResolvedValue({
      data: [{ id: PATH_ID }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
    });

    const result = await listLearningPathsService(ORG_ID, { page: 1, limit: 20 });

    expect(mocks.listOrgLearningPaths).toHaveBeenCalledWith(
      ORG_ID,
      '',
      { [ORG_ID]: ROLE.ADMIN },
      { page: 1, limit: 20, search: undefined }
    );
    expect(result.data).toHaveLength(1);
  });

  it('returns detail with ordered course ids', async () => {
    mocks.listLearningPathCourses.mockResolvedValue([
      { id: 'pc-1', courseId: 'c-1', order: 0 },
      { id: 'pc-2', courseId: 'c-2', order: 1 }
    ]);

    const result = await getLearningPathService(ORG_ID, { pathId: PATH_ID });

    expect(result.courseIds).toEqual(['c-1', 'c-2']);
    expect(result.courses).toHaveLength(2);
  });

  it('rejects paths from other organizations', async () => {
    mocks.resolveLearningPath.mockResolvedValue({ id: PATH_ID, organizationId: 'other-org' });

    await expect(getLearningPathService(ORG_ID, { pathId: PATH_ID })).rejects.toMatchObject({
      code: ErrorCodes.LEARNING_PATH_NOT_FOUND,
      statusCode: 404
    });
    await expect(deletePublicApiLearningPathService(ORG_ID, { pathId: PATH_ID })).rejects.toMatchObject({
      code: ErrorCodes.LEARNING_PATH_NOT_FOUND,
      statusCode: 404
    });
  });

  it('requires an automation actor to create paths', async () => {
    await expect(
      createPublicApiLearningPathService(ORG_ID, null, { name: 'P', description: 'D' })
    ).rejects.toMatchObject({ code: ErrorCodes.UNAUTHORIZED, statusCode: 401 });

    expect(mocks.createLearningPathService).not.toHaveBeenCalled();
  });

  it('creates paths and applies cost in a second step', async () => {
    mocks.createLearningPathService.mockResolvedValue({ id: PATH_ID, name: 'P' });
    mocks.updateLearningPathService.mockResolvedValue({ id: PATH_ID, name: 'P', cost: 5000 });

    const result = await createPublicApiLearningPathService(ORG_ID, 'actor-1', {
      name: 'P',
      description: 'D',
      cost: 5000
    });

    expect(mocks.createLearningPathService).toHaveBeenCalledWith(
      ORG_ID,
      'actor-1',
      { name: 'P', description: 'D' },
      { [ORG_ID]: ROLE.ADMIN }
    );
    expect(mocks.updateLearningPathService).toHaveBeenCalledWith(
      PATH_ID,
      'actor-1',
      { cost: 5000 },
      { [ORG_ID]: ROLE.ADMIN }
    );
    expect(result).toMatchObject({ cost: 5000 });
  });

  it('adds courses to org paths only', async () => {
    mocks.addCoursesToPathService.mockResolvedValue([{ id: 'pc-1' }]);

    const result = await addCoursesToPublicApiLearningPathService(
      ORG_ID,
      'actor-1',
      { pathId: PATH_ID },
      { courseIds: ['c-1'] }
    );

    expect(mocks.addCoursesToPathService).toHaveBeenCalledWith(PATH_ID, { courseIds: ['c-1'] }, 'actor-1', {
      [ORG_ID]: ROLE.ADMIN
    });
    expect(result).toHaveLength(1);
  });

  it('updates org paths only', async () => {
    mocks.updateLearningPathService.mockResolvedValue({ id: PATH_ID, name: 'Renamed' });

    const result = await updatePublicApiLearningPathService(
      ORG_ID,
      'actor-1',
      { pathId: PATH_ID },
      { name: 'Renamed' }
    );

    expect(mocks.updateLearningPathService).toHaveBeenCalledWith(
      PATH_ID,
      'actor-1',
      { name: 'Renamed' },
      { [ORG_ID]: ROLE.ADMIN }
    );
    expect(result).toMatchObject({ name: 'Renamed' });
  });

  it('requires an automation actor to update or reorder paths', async () => {
    await expect(
      updatePublicApiLearningPathService(ORG_ID, null, { pathId: PATH_ID }, { name: 'X' })
    ).rejects.toMatchObject({ code: ErrorCodes.UNAUTHORIZED, statusCode: 401 });
    await expect(
      reorderPublicApiPathCoursesService(ORG_ID, null, { pathId: PATH_ID }, { courseIds: [PATH_ID] })
    ).rejects.toMatchObject({ code: ErrorCodes.UNAUTHORIZED, statusCode: 401 });

    expect(mocks.updateLearningPathService).not.toHaveBeenCalled();
    expect(mocks.reorderPathCoursesService).not.toHaveBeenCalled();
  });

  it('reorders courses in org paths only', async () => {
    mocks.reorderPathCoursesService.mockResolvedValue({ id: PATH_ID });

    const courseId = '33333333-3333-3333-3333-333333333333';
    const result = await reorderPublicApiPathCoursesService(
      ORG_ID,
      'actor-1',
      { pathId: PATH_ID },
      { courseIds: [courseId] }
    );

    expect(mocks.reorderPathCoursesService).toHaveBeenCalledWith(PATH_ID, [courseId], 'actor-1', {
      [ORG_ID]: ROLE.ADMIN
    });
    expect(result).toMatchObject({ id: PATH_ID });
  });

  it('lists students enrolled in org paths only', async () => {
    mocks.listLearningPathMembers.mockResolvedValue({ data: [{ id: 'm-1' }] });

    const result = await listPublicApiLearningPathStudentsService(ORG_ID, { pathId: PATH_ID });

    expect(mocks.listLearningPathMembers).toHaveBeenCalledWith(PATH_ID, {
      page: 1,
      limit: 100,
      roleId: ROLE.STUDENT
    });
    expect(result).toHaveLength(1);
  });

  it('removes courses from org paths only', async () => {
    mocks.removeCourseFromPathService.mockResolvedValue({ id: PATH_ID });

    const courseId = '33333333-3333-3333-3333-333333333333';
    const result = await removeCourseFromPublicApiPathService(ORG_ID, 'actor-1', {
      pathId: PATH_ID,
      courseId
    });

    expect(mocks.removeCourseFromPathService).toHaveBeenCalledWith(PATH_ID, courseId, 'actor-1', {
      [ORG_ID]: ROLE.ADMIN
    });
    expect(result).toMatchObject({ id: PATH_ID });
  });
});
