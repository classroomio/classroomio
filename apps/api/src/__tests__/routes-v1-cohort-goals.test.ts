import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/cohort-goal', () => ({
  listPublicApiCohortGoalsService: vi.fn(),
  createPublicApiCohortGoalService: vi.fn(),
  getPublicApiCohortGoalService: vi.fn(),
  updatePublicApiCohortGoalService: vi.fn(),
  archivePublicApiCohortGoalService: vi.fn(),
  deletePublicApiCohortGoalService: vi.fn()
}));

vi.mock('@api/services/v1/cohort', () => ({
  listCohortsService: vi.fn(),
  createPublicApiCohortService: vi.fn(),
  getPublicApiCohortService: vi.fn(),
  updatePublicApiCohortService: vi.fn(),
  deletePublicApiCohortService: vi.fn()
}));

vi.mock('@api/services/v1/cohort-member', () => ({
  listPublicApiCohortMembersService: vi.fn(),
  addPublicApiCohortMembersService: vi.fn(),
  updatePublicApiCohortMemberService: vi.fn(),
  removePublicApiCohortMemberService: vi.fn()
}));

vi.mock('@api/services/v1/cohort-course', () => ({
  listPublicApiCohortCoursesService: vi.fn(),
  addPublicApiCohortCourseService: vi.fn(),
  removePublicApiCohortCourseService: vi.fn()
}));

vi.mock('@api/services/v1/cohort-newsfeed', () => ({
  listPublicApiCohortNewsfeedService: vi.fn(),
  createPublicApiCohortNewsfeedService: vi.fn(),
  updatePublicApiCohortNewsfeedService: vi.fn(),
  updatePublicApiCohortNewsfeedReactionService: vi.fn(),
  deletePublicApiCohortNewsfeedService: vi.fn(),
  listPublicApiCohortNewsfeedCommentsService: vi.fn(),
  createPublicApiCohortNewsfeedCommentService: vi.fn(),
  deletePublicApiCohortNewsfeedCommentService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import {
  archivePublicApiCohortGoalService,
  createPublicApiCohortGoalService,
  deletePublicApiCohortGoalService,
  getPublicApiCohortGoalService,
  listPublicApiCohortGoalsService,
  updatePublicApiCohortGoalService
} from '@api/services/v1/cohort-goal';
import { v1CohortsRouter } from '@api/routes/v1/cohorts';

const COHORT_ID = '11111111-1111-4111-8111-111111111111';
const GOAL_ID = '22222222-2222-4222-8222-222222222222';

const app = new Hono()
  .use('*', async (c, next) => {
    c.set('orgId', 'org-1');
    c.set('actorId', 'actor-1');
    await next();
  })
  .route('/', v1CohortsRouter);

const jsonRequest = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const CREATE_GOAL_PAYLOAD = {
  title: 'Finish onboarding',
  type: 'complete_all' as const,
  courseIds: ['33333333-3333-4333-8333-333333333333'],
  deadlineKind: 'none' as const
};

describe('v1CohortsRouter goal routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists goals for a cohort', async () => {
    vi.mocked(listPublicApiCohortGoalsService).mockResolvedValue([]);

    const response = await app.request(`/${COHORT_ID}/goals`);

    expect(response.status).toBe(200);
    expect(listPublicApiCohortGoalsService).toHaveBeenCalledWith('org-1', { cohortId: COHORT_ID });
  });

  it('creates a goal using the automation actor', async () => {
    vi.mocked(createPublicApiCohortGoalService).mockResolvedValue({ id: GOAL_ID } as Awaited<
      ReturnType<typeof createPublicApiCohortGoalService>
    >);

    const response = await app.request(`/${COHORT_ID}/goals`, jsonRequest('POST', CREATE_GOAL_PAYLOAD));

    expect(response.status).toBe(201);
    expect(createPublicApiCohortGoalService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID },
      { ...CREATE_GOAL_PAYLOAD, reminderDaysBefore: [7, 1] }
    );
  });

  it('gets, updates, archives, and deletes a goal', async () => {
    vi.mocked(getPublicApiCohortGoalService).mockResolvedValue({ id: GOAL_ID } as Awaited<
      ReturnType<typeof getPublicApiCohortGoalService>
    >);
    vi.mocked(updatePublicApiCohortGoalService).mockResolvedValue({ id: GOAL_ID } as Awaited<
      ReturnType<typeof updatePublicApiCohortGoalService>
    >);
    vi.mocked(archivePublicApiCohortGoalService).mockResolvedValue({ id: GOAL_ID } as Awaited<
      ReturnType<typeof archivePublicApiCohortGoalService>
    >);
    vi.mocked(deletePublicApiCohortGoalService).mockResolvedValue({ id: GOAL_ID } as Awaited<
      ReturnType<typeof deletePublicApiCohortGoalService>
    >);

    const got = await app.request(`/${COHORT_ID}/goals/${GOAL_ID}`);
    const updated = await app.request(`/${COHORT_ID}/goals/${GOAL_ID}`, jsonRequest('PUT', { title: 'Renamed' }));
    const archived = await app.request(`/${COHORT_ID}/goals/${GOAL_ID}/archive`, { method: 'POST' });
    const deleted = await app.request(`/${COHORT_ID}/goals/${GOAL_ID}`, { method: 'DELETE' });

    expect(got.status).toBe(200);
    expect(getPublicApiCohortGoalService).toHaveBeenCalledWith('org-1', { cohortId: COHORT_ID, goalId: GOAL_ID });
    expect(updated.status).toBe(200);
    expect(updatePublicApiCohortGoalService).toHaveBeenCalledWith(
      'org-1',
      { cohortId: COHORT_ID, goalId: GOAL_ID },
      { title: 'Renamed' }
    );
    expect(archived.status).toBe(200);
    expect(archivePublicApiCohortGoalService).toHaveBeenCalledWith('org-1', { cohortId: COHORT_ID, goalId: GOAL_ID });
    expect(deleted.status).toBe(200);
    expect(deletePublicApiCohortGoalService).toHaveBeenCalledWith('org-1', { cohortId: COHORT_ID, goalId: GOAL_ID });
  });

  it('rejects a goal body that fails the type-specific refine rules', async () => {
    const response = await app.request(
      `/${COHORT_ID}/goals`,
      jsonRequest('POST', { title: 'Bad goal', type: 'n_of_m', courseIds: ['33333333-3333-4333-8333-333333333333'] })
    );

    expect(response.status).toBe(400);
    expect(createPublicApiCohortGoalService).not.toHaveBeenCalled();
  });
});
