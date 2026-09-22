import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortOrganizationId: vi.fn(),
  getCohortMemberRole: vi.fn(),
  isOrgAdminByCohortId: vi.fn(),
  getCohortMemberByProfileId: vi.fn(),
  getCohortNewsfeedCommentById: vi.fn()
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

import {
  getCohortMemberByProfileId,
  getCohortMemberRole,
  getCohortNewsfeedCommentById,
  getCohortOrganizationId,
  isOrgAdminByCohortId
} from '@cio/db/queries/cohort';
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
import { ROLE } from '@cio/utils/constants';
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
const ACTOR_ID = 'actor-1';
const ACTOR_MEMBER_ID = 'actor-member-1';

const cohortParams = { cohortId: COHORT_ID };
const feedParams = { cohortId: COHORT_ID, feedId: FEED_ID };
const commentParams = { cohortId: COHORT_ID, feedId: FEED_ID, commentId: COMMENT_ID };

/** Default happy path: actor is a cohort tutor, so the team-or-admin gate passes. */
function mockActorAsCohortTeamMember() {
  vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.TUTOR);
  vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
}

describe('v1 cohort newsfeed service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    mockActorAsCohortTeamMember();
  });

  it('lists the newsfeed after the org guard passes, with no team-membership requirement', async () => {
    vi.mocked(listCohortNewsfeed).mockResolvedValue({ items: [], totalCount: 0, hasMore: false, nextCursor: null });

    await listPublicApiCohortNewsfeedService(ORG_ID, cohortParams, { limit: 10 });

    expect(listCohortNewsfeed).toHaveBeenCalledWith(COHORT_ID, { limit: 10 });
  });

  it('creates a post using the automation actor as the author, once they are a team member', async () => {
    vi.mocked(createCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof createCohortNewsfeedService>
    >);

    await createPublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, cohortParams, { content: 'Hello' });

    expect(createCohortNewsfeedService).toHaveBeenCalledWith(COHORT_ID, ACTOR_ID, { content: 'Hello' });
  });

  it('refuses to create a post when the actor is not a cohort team member', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);

    await expect(
      createPublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, cohortParams, { content: 'Hello' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(createCohortNewsfeedService).not.toHaveBeenCalled();
  });

  it('rejects creating a post with no automation actor', async () => {
    await expect(
      createPublicApiCohortNewsfeedService(ORG_ID, null, cohortParams, { content: 'Hello' })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(createCohortNewsfeedService).not.toHaveBeenCalled();
  });

  it('updates a post once the actor is a team member, and passes the full reaction object through unchanged', async () => {
    vi.mocked(updateCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof updateCohortNewsfeedService>
    >);
    const reaction = { clap: ['member-1'], smile: [], thumbsup: [], thumbsdown: [] };
    vi.mocked(updateCohortNewsfeedReactionService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof updateCohortNewsfeedReactionService>
    >);

    await updatePublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, feedParams, { content: 'Edited' });
    await updatePublicApiCohortNewsfeedReactionService(ORG_ID, feedParams, { reaction });

    expect(updateCohortNewsfeedService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, { content: 'Edited' });
    expect(updateCohortNewsfeedReactionService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, { reaction });
  });

  it('refuses to update a post when the actor is not a cohort team member', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);

    await expect(
      updatePublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, feedParams, { content: 'Edited' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(updateCohortNewsfeedService).not.toHaveBeenCalled();
  });

  it('deletes a post once the actor is a team member', async () => {
    vi.mocked(deleteCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof deleteCohortNewsfeedService>
    >);

    await deletePublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, feedParams);

    expect(deleteCohortNewsfeedService).toHaveBeenCalledWith(COHORT_ID, FEED_ID);
  });

  it('lists comments with no team-membership requirement, and creates comments using the automation actor', async () => {
    vi.mocked(listCohortNewsfeedComments).mockResolvedValue([]);
    vi.mocked(createCohortNewsfeedCommentService).mockResolvedValue({ id: COMMENT_ID } as Awaited<
      ReturnType<typeof createCohortNewsfeedCommentService>
    >);

    await listPublicApiCohortNewsfeedCommentsService(ORG_ID, feedParams);
    await createPublicApiCohortNewsfeedCommentService(ORG_ID, ACTOR_ID, feedParams, { content: 'Nice!' });

    expect(listCohortNewsfeedComments).toHaveBeenCalledWith(COHORT_ID, FEED_ID);
    expect(createCohortNewsfeedCommentService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, ACTOR_ID, {
      content: 'Nice!'
    });
  });

  it('rejects creating a comment with no automation actor', async () => {
    await expect(
      createPublicApiCohortNewsfeedCommentService(ORG_ID, null, feedParams, { content: 'Nice!' })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(createCohortNewsfeedCommentService).not.toHaveBeenCalled();
  });

  it('deletes a comment when the actor is its own author', async () => {
    vi.mocked(getCohortNewsfeedCommentById).mockResolvedValue({
      id: COMMENT_ID,
      cohortNewsfeedId: FEED_ID,
      authorId: ACTOR_MEMBER_ID
    } as Awaited<ReturnType<typeof getCohortNewsfeedCommentById>>);
    vi.mocked(getCohortMemberByProfileId).mockResolvedValue({ id: ACTOR_MEMBER_ID } as Awaited<
      ReturnType<typeof getCohortMemberByProfileId>
    >);
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
    vi.mocked(deleteCohortNewsfeedCommentService).mockResolvedValue({ id: COMMENT_ID } as Awaited<
      ReturnType<typeof deleteCohortNewsfeedCommentService>
    >);

    await deletePublicApiCohortNewsfeedCommentService(ORG_ID, ACTOR_ID, commentParams);

    expect(deleteCohortNewsfeedCommentService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, COMMENT_ID);
  });

  it('deletes a comment when the actor is a cohort team member, even if not the author', async () => {
    vi.mocked(getCohortNewsfeedCommentById).mockResolvedValue({
      id: COMMENT_ID,
      cohortNewsfeedId: FEED_ID,
      authorId: 'someone-elses-member-id'
    } as Awaited<ReturnType<typeof getCohortNewsfeedCommentById>>);
    vi.mocked(getCohortMemberByProfileId).mockResolvedValue({ id: ACTOR_MEMBER_ID } as Awaited<
      ReturnType<typeof getCohortMemberByProfileId>
    >);
    vi.mocked(deleteCohortNewsfeedCommentService).mockResolvedValue({ id: COMMENT_ID } as Awaited<
      ReturnType<typeof deleteCohortNewsfeedCommentService>
    >);

    await deletePublicApiCohortNewsfeedCommentService(ORG_ID, ACTOR_ID, commentParams);

    expect(deleteCohortNewsfeedCommentService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, COMMENT_ID);
  });

  it('refuses to delete another member\'s comment when the actor is neither the author nor a team member', async () => {
    vi.mocked(getCohortNewsfeedCommentById).mockResolvedValue({
      id: COMMENT_ID,
      cohortNewsfeedId: FEED_ID,
      authorId: 'someone-elses-member-id'
    } as Awaited<ReturnType<typeof getCohortNewsfeedCommentById>>);
    vi.mocked(getCohortMemberByProfileId).mockResolvedValue({ id: ACTOR_MEMBER_ID } as Awaited<
      ReturnType<typeof getCohortMemberByProfileId>
    >);
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);

    await expect(deletePublicApiCohortNewsfeedCommentService(ORG_ID, ACTOR_ID, commentParams)).rejects.toMatchObject({
      statusCode: 403
    });
    expect(deleteCohortNewsfeedCommentService).not.toHaveBeenCalled();
  });

  it('404s deleting a comment that does not belong to the given feed', async () => {
    vi.mocked(getCohortNewsfeedCommentById).mockResolvedValue({
      id: COMMENT_ID,
      cohortNewsfeedId: 'a-different-feed',
      authorId: ACTOR_MEMBER_ID
    } as Awaited<ReturnType<typeof getCohortNewsfeedCommentById>>);

    await expect(deletePublicApiCohortNewsfeedCommentService(ORG_ID, ACTOR_ID, commentParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(deleteCohortNewsfeedCommentService).not.toHaveBeenCalled();
  });

  it('refuses to touch the newsfeed of a cohort from another organization', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(listPublicApiCohortNewsfeedService(ORG_ID, cohortParams, { limit: 10 })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(listCohortNewsfeed).not.toHaveBeenCalled();
  });
});
