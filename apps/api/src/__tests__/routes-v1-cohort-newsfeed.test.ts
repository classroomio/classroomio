import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/cohort-newsfeed', () => ({
  listPublicApiCohortNewsfeedService: vi.fn(),
  createPublicApiCohortNewsfeedService: vi.fn(),
  updatePublicApiCohortNewsfeedService: vi.fn(),
  setPublicApiCohortNewsfeedReactionService: vi.fn(),
  deletePublicApiCohortNewsfeedService: vi.fn(),
  listPublicApiCohortNewsfeedCommentsService: vi.fn(),
  createPublicApiCohortNewsfeedCommentService: vi.fn(),
  deletePublicApiCohortNewsfeedCommentService: vi.fn()
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

vi.mock('@api/services/v1/cohort-goal', () => ({
  listPublicApiCohortGoalsService: vi.fn(),
  createPublicApiCohortGoalService: vi.fn(),
  getPublicApiCohortGoalService: vi.fn(),
  updatePublicApiCohortGoalService: vi.fn(),
  archivePublicApiCohortGoalService: vi.fn(),
  deletePublicApiCohortGoalService: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import {
  createPublicApiCohortNewsfeedCommentService,
  createPublicApiCohortNewsfeedService,
  deletePublicApiCohortNewsfeedCommentService,
  deletePublicApiCohortNewsfeedService,
  listPublicApiCohortNewsfeedCommentsService,
  listPublicApiCohortNewsfeedService,
  setPublicApiCohortNewsfeedReactionService,
  updatePublicApiCohortNewsfeedService
} from '@api/services/v1/cohort-newsfeed';
import { v1CohortsRouter } from '@api/routes/v1/cohorts';

const COHORT_ID = '11111111-1111-4111-8111-111111111111';
const FEED_ID = '22222222-2222-4222-8222-222222222222';
const COMMENT_ID = 42;

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

describe('v1CohortsRouter newsfeed routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists the newsfeed with pagination params', async () => {
    vi.mocked(listPublicApiCohortNewsfeedService).mockResolvedValue({
      items: [],
      totalCount: 0,
      hasMore: false,
      nextCursor: null
    });

    const response = await app.request(`/${COHORT_ID}/newsfeed?limit=5`);

    expect(response.status).toBe(200);
    expect(listPublicApiCohortNewsfeedService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID },
      { limit: 5 }
    );
    expect(await response.json()).toEqual({
      success: true,
      data: { items: [], totalCount: 0, hasMore: false, nextCursor: null }
    });
  });

  it('passes a compound cursor through and rejects a malformed one with a 400', async () => {
    vi.mocked(listPublicApiCohortNewsfeedService).mockResolvedValue({
      items: [],
      totalCount: 0,
      hasMore: false,
      nextCursor: null
    });
    const cursor = `2026-09-23 10:00:00.123456+00|${FEED_ID}`;

    const valid = await app.request(`/${COHORT_ID}/newsfeed?cursor=${encodeURIComponent(cursor)}`);
    const invalid = await app.request(`/${COHORT_ID}/newsfeed?cursor=not-a-date`);

    expect(valid.status).toBe(200);
    expect(listPublicApiCohortNewsfeedService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID },
      { cursor, limit: 10 }
    );
    expect(invalid.status).toBe(400);
  });

  it('creates a post using the automation actor', async () => {
    vi.mocked(createPublicApiCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof createPublicApiCohortNewsfeedService>
    >);

    const response = await app.request(`/${COHORT_ID}/newsfeed`, jsonRequest('POST', { content: 'Hello cohort' }));

    expect(response.status).toBe(201);
    expect(createPublicApiCohortNewsfeedService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID },
      { content: 'Hello cohort' }
    );
  });

  it('updates a post and its reaction', async () => {
    vi.mocked(updatePublicApiCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof updatePublicApiCohortNewsfeedService>
    >);
    vi.mocked(setPublicApiCohortNewsfeedReactionService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof setPublicApiCohortNewsfeedReactionService>
    >);

    const updated = await app.request(`/${COHORT_ID}/newsfeed/${FEED_ID}`, jsonRequest('PUT', { content: 'Edited' }));
    const reacted = await app.request(
      `/${COHORT_ID}/newsfeed/${FEED_ID}/react`,
      jsonRequest('PUT', { reaction: 'clap' })
    );
    const cleared = await app.request(
      `/${COHORT_ID}/newsfeed/${FEED_ID}/react`,
      jsonRequest('PUT', { reaction: null })
    );

    expect(updated.status).toBe(200);
    expect(updatePublicApiCohortNewsfeedService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID, feedId: FEED_ID },
      { content: 'Edited' }
    );
    expect(reacted.status).toBe(200);
    expect(setPublicApiCohortNewsfeedReactionService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID, feedId: FEED_ID },
      { reaction: 'clap' }
    );
    expect(cleared.status).toBe(200);
    expect(setPublicApiCohortNewsfeedReactionService).toHaveBeenLastCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID, feedId: FEED_ID },
      { reaction: null }
    );
  });

  it('rejects the old full-state reaction body and unknown reaction types with a 400', async () => {
    const fullState = await app.request(
      `/${COHORT_ID}/newsfeed/${FEED_ID}/react`,
      jsonRequest('PUT', { reaction: { clap: ['someone-else'], smile: [], thumbsup: [], thumbsdown: [] } })
    );
    const unknown = await app.request(
      `/${COHORT_ID}/newsfeed/${FEED_ID}/react`,
      jsonRequest('PUT', { reaction: 'heart' })
    );

    expect(fullState.status).toBe(400);
    expect(unknown.status).toBe(400);
    expect(setPublicApiCohortNewsfeedReactionService).not.toHaveBeenCalled();
  });

  it('deletes a post', async () => {
    vi.mocked(deletePublicApiCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof deletePublicApiCohortNewsfeedService>
    >);

    const response = await app.request(`/${COHORT_ID}/newsfeed/${FEED_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(200);
    expect(deletePublicApiCohortNewsfeedService).toHaveBeenCalledWith('org-1', 'actor-1', {
      cohortId: COHORT_ID,
      feedId: FEED_ID
    });
  });

  it('lists and creates comments using the automation actor', async () => {
    vi.mocked(listPublicApiCohortNewsfeedCommentsService).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    } as Awaited<ReturnType<typeof listPublicApiCohortNewsfeedCommentsService>>);
    vi.mocked(createPublicApiCohortNewsfeedCommentService).mockResolvedValue({ id: COMMENT_ID } as Awaited<
      ReturnType<typeof createPublicApiCohortNewsfeedCommentService>
    >);

    const list = await app.request(`/${COHORT_ID}/newsfeed/${FEED_ID}/comments`);
    const created = await app.request(
      `/${COHORT_ID}/newsfeed/${FEED_ID}/comment`,
      jsonRequest('POST', { content: 'Nice!' })
    );

    expect(list.status).toBe(200);
    expect(listPublicApiCohortNewsfeedCommentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID, feedId: FEED_ID },
      { page: 1, limit: 20 }
    );
    expect(created.status).toBe(201);
    expect(createPublicApiCohortNewsfeedCommentService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { cohortId: COHORT_ID, feedId: FEED_ID },
      { content: 'Nice!' }
    );
  });

  it('deletes a comment by numeric commentId', async () => {
    vi.mocked(deletePublicApiCohortNewsfeedCommentService).mockResolvedValue({ id: COMMENT_ID } as Awaited<
      ReturnType<typeof deletePublicApiCohortNewsfeedCommentService>
    >);

    const response = await app.request(`/${COHORT_ID}/newsfeed/${FEED_ID}/comment/${COMMENT_ID}`, {
      method: 'DELETE'
    });

    expect(response.status).toBe(200);
    expect(deletePublicApiCohortNewsfeedCommentService).toHaveBeenCalledWith('org-1', 'actor-1', {
      cohortId: COHORT_ID,
      feedId: FEED_ID,
      commentId: COMMENT_ID
    });
  });
});
