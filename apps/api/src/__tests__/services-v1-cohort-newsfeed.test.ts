import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortOrganizationId: vi.fn()
}));

vi.mock('@api/services/cohort/cohort', () => ({
  listCohortNewsfeed: vi.fn(),
  createCohortNewsfeedService: vi.fn(),
  updateCohortNewsfeedService: vi.fn(),
  updateCohortNewsfeedReactionService: vi.fn(),
  deleteCohortNewsfeedService: vi.fn(),
  listCohortNewsfeedComments: vi.fn(),
  createCohortNewsfeedCommentService: vi.fn(),
  deleteCohortNewsfeedCommentService: vi.fn()
}));

import { getCohortOrganizationId } from '@cio/db/queries/cohort';
import {
  createCohortNewsfeedCommentService,
  createCohortNewsfeedService,
  deleteCohortNewsfeedCommentService,
  deleteCohortNewsfeedService,
  listCohortNewsfeed,
  listCohortNewsfeedComments,
  updateCohortNewsfeedReactionService,
  updateCohortNewsfeedService
} from '@api/services/cohort/cohort';
import {
  createPublicApiCohortNewsfeedCommentService,
  createPublicApiCohortNewsfeedService,
  deletePublicApiCohortNewsfeedCommentService,
  deletePublicApiCohortNewsfeedService,
  listPublicApiCohortNewsfeedCommentsService,
  listPublicApiCohortNewsfeedService,
  updatePublicApiCohortNewsfeedReactionService,
  updatePublicApiCohortNewsfeedService
} from '@api/services/v1/cohort-newsfeed';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const COHORT_ID = 'cohort-1';
const FEED_ID = 'feed-1';
const COMMENT_ID = 42;

const cohortParams = { cohortId: COHORT_ID };
const feedParams = { cohortId: COHORT_ID, feedId: FEED_ID };
const commentParams = { cohortId: COHORT_ID, feedId: FEED_ID, commentId: COMMENT_ID };

describe('v1 cohort newsfeed service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
  });

  it('lists the newsfeed after the org guard passes', async () => {
    vi.mocked(listCohortNewsfeed).mockResolvedValue({ items: [], totalCount: 0, hasMore: false, nextCursor: null });

    await listPublicApiCohortNewsfeedService(ORG_ID, cohortParams, { limit: 10 });

    expect(listCohortNewsfeed).toHaveBeenCalledWith(COHORT_ID, { limit: 10 });
  });

  it('creates a post using the automation actor as the author', async () => {
    vi.mocked(createCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof createCohortNewsfeedService>
    >);

    await createPublicApiCohortNewsfeedService(ORG_ID, 'actor-1', cohortParams, { content: 'Hello' });

    expect(createCohortNewsfeedService).toHaveBeenCalledWith(COHORT_ID, 'actor-1', { content: 'Hello' });
  });

  it('rejects creating a post with no automation actor', async () => {
    await expect(
      createPublicApiCohortNewsfeedService(ORG_ID, null, cohortParams, { content: 'Hello' })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(createCohortNewsfeedService).not.toHaveBeenCalled();
  });

  it('updates a post and passes the full reaction object through unchanged', async () => {
    vi.mocked(updateCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof updateCohortNewsfeedService>
    >);
    const reaction = { clap: ['member-1'], smile: [], thumbsup: [], thumbsdown: [] };
    vi.mocked(updateCohortNewsfeedReactionService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof updateCohortNewsfeedReactionService>
    >);

    await updatePublicApiCohortNewsfeedService(ORG_ID, feedParams, { content: 'Edited' });
    await updatePublicApiCohortNewsfeedReactionService(ORG_ID, feedParams, { reaction });

    expect(updateCohortNewsfeedService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, { content: 'Edited' });
    expect(updateCohortNewsfeedReactionService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, { reaction });
  });

  it('deletes a post', async () => {
    vi.mocked(deleteCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof deleteCohortNewsfeedService>
    >);

    await deletePublicApiCohortNewsfeedService(ORG_ID, feedParams);

    expect(deleteCohortNewsfeedService).toHaveBeenCalledWith(COHORT_ID, FEED_ID);
  });

  it('lists and creates comments using the automation actor', async () => {
    vi.mocked(listCohortNewsfeedComments).mockResolvedValue([]);
    vi.mocked(createCohortNewsfeedCommentService).mockResolvedValue({ id: COMMENT_ID } as Awaited<
      ReturnType<typeof createCohortNewsfeedCommentService>
    >);

    await listPublicApiCohortNewsfeedCommentsService(ORG_ID, feedParams);
    await createPublicApiCohortNewsfeedCommentService(ORG_ID, 'actor-1', feedParams, { content: 'Nice!' });

    expect(listCohortNewsfeedComments).toHaveBeenCalledWith(COHORT_ID, FEED_ID);
    expect(createCohortNewsfeedCommentService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, 'actor-1', {
      content: 'Nice!'
    });
  });

  it('rejects creating a comment with no automation actor', async () => {
    await expect(
      createPublicApiCohortNewsfeedCommentService(ORG_ID, null, feedParams, { content: 'Nice!' })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(createCohortNewsfeedCommentService).not.toHaveBeenCalled();
  });

  it('deletes a comment by cohortId + feedId + commentId', async () => {
    vi.mocked(deleteCohortNewsfeedCommentService).mockResolvedValue({ id: COMMENT_ID } as Awaited<
      ReturnType<typeof deleteCohortNewsfeedCommentService>
    >);

    await deletePublicApiCohortNewsfeedCommentService(ORG_ID, commentParams);

    expect(deleteCohortNewsfeedCommentService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, COMMENT_ID);
  });

  it('refuses to touch the newsfeed of a cohort from another organization', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(listPublicApiCohortNewsfeedService(ORG_ID, cohortParams, { limit: 10 })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(listCohortNewsfeed).not.toHaveBeenCalled();
  });

});
