import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortOrganizationId: vi.fn(),
  getCohortMemberRole: vi.fn(),
  isCohortMember: vi.fn(),
  isOrgAdminByCohortId: vi.fn(),
  getCohortMemberByProfileId: vi.fn(),
  getCohortNewsfeedById: vi.fn(),
  getCohortNewsfeedCommentById: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn()
}));

vi.mock('@api/services/cohort/cohort', () => ({
  listCohortNewsfeed: vi.fn(),
  createCohortNewsfeedService: vi.fn(),
  updateCohortNewsfeedService: vi.fn(),
  updateCohortNewsfeedReactionService: vi.fn(),
  deleteCohortNewsfeedService: vi.fn(),
  listCohortNewsfeedCommentsPage: vi.fn(),
  createCohortNewsfeedCommentService: vi.fn(),
  deleteCohortNewsfeedCommentService: vi.fn()
}));

import {
  getCohortMemberByProfileId,
  getCohortMemberRole,
  getCohortNewsfeedById,
  getCohortNewsfeedCommentById,
  getCohortOrganizationId,
  isCohortMember,
  isOrgAdminByCohortId
} from '@cio/db/queries/cohort';
import {
  createCohortNewsfeedCommentService,
  createCohortNewsfeedService,
  deleteCohortNewsfeedCommentService,
  deleteCohortNewsfeedService,
  listCohortNewsfeed,
  listCohortNewsfeedCommentsPage,
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
const reaction = { clap: ['member-1'], smile: [], thumbsup: [], thumbsdown: [] };

function mockActorAsCohortTutor() {
  vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.TUTOR);
  vi.mocked(isCohortMember).mockResolvedValue(true);
  vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
}

function mockActorAsCohortStudent() {
  vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);
  vi.mocked(isCohortMember).mockResolvedValue(true);
  vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
}

function mockActorAsOutsider() {
  vi.mocked(getCohortMemberRole).mockResolvedValue(null);
  vi.mocked(isCohortMember).mockResolvedValue(false);
  vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
}

describe('v1 cohort newsfeed service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(getCohortNewsfeedById).mockResolvedValue({ id: FEED_ID, cohortId: COHORT_ID } as Awaited<
      ReturnType<typeof getCohortNewsfeedById>
    >);
    mockActorAsCohortTutor();
  });

  it('lists the newsfeed when the actor is a cohort member', async () => {
    mockActorAsCohortStudent();
    vi.mocked(listCohortNewsfeed).mockResolvedValue({ items: [], totalCount: 0, hasMore: false, nextCursor: null });

    await listPublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, cohortParams, { limit: 10 });

    expect(listCohortNewsfeed).toHaveBeenCalledWith(COHORT_ID, { limit: 10 });
  });

  it('refuses to list the newsfeed when the actor is neither a member nor an org admin', async () => {
    mockActorAsOutsider();

    await expect(
      listPublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, cohortParams, { limit: 10 })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(listCohortNewsfeed).not.toHaveBeenCalled();
  });

  it('creates a post using the automation actor as the author, once they are a team member', async () => {
    vi.mocked(createCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof createCohortNewsfeedService>
    >);

    await createPublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, cohortParams, { content: 'Hello' });

    expect(createCohortNewsfeedService).toHaveBeenCalledWith(COHORT_ID, ACTOR_ID, { content: 'Hello' });
  });

  it('refuses to create a post when the actor is a student in the cohort', async () => {
    mockActorAsCohortStudent();

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

  it('updates a post once the actor is a team member', async () => {
    vi.mocked(updateCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof updateCohortNewsfeedService>
    >);

    await updatePublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, feedParams, { content: 'Edited' });

    expect(updateCohortNewsfeedService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, { content: 'Edited' });
  });

  it('refuses to update a post when the actor is a student in the cohort', async () => {
    mockActorAsCohortStudent();

    await expect(
      updatePublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, feedParams, { content: 'Edited' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(updateCohortNewsfeedService).not.toHaveBeenCalled();
  });

  it('replaces reactions when the actor is a cohort member, passing the full object through', async () => {
    mockActorAsCohortStudent();
    vi.mocked(updateCohortNewsfeedReactionService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof updateCohortNewsfeedReactionService>
    >);

    await updatePublicApiCohortNewsfeedReactionService(ORG_ID, ACTOR_ID, feedParams, { reaction });

    expect(updateCohortNewsfeedReactionService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, { reaction });
  });

  it('refuses to replace reactions when the actor is neither a member nor an org admin', async () => {
    mockActorAsOutsider();

    await expect(
      updatePublicApiCohortNewsfeedReactionService(ORG_ID, ACTOR_ID, feedParams, { reaction })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(updateCohortNewsfeedReactionService).not.toHaveBeenCalled();
  });

  it('rejects replacing reactions with no automation actor', async () => {
    await expect(
      updatePublicApiCohortNewsfeedReactionService(ORG_ID, null, feedParams, { reaction })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(updateCohortNewsfeedReactionService).not.toHaveBeenCalled();
  });

  it('deletes a post once the actor is a team member', async () => {
    vi.mocked(deleteCohortNewsfeedService).mockResolvedValue({ id: FEED_ID } as Awaited<
      ReturnType<typeof deleteCohortNewsfeedService>
    >);

    await deletePublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, feedParams);

    expect(deleteCohortNewsfeedService).toHaveBeenCalledWith(COHORT_ID, FEED_ID);
  });

  it('lists comments a page at a time for a cohort member', async () => {
    mockActorAsCohortStudent();
    vi.mocked(listCohortNewsfeedCommentsPage).mockResolvedValue({ items: [], total: 3 });

    const result = await listPublicApiCohortNewsfeedCommentsService(ORG_ID, ACTOR_ID, feedParams, {
      page: 1,
      limit: 20
    });

    expect(listCohortNewsfeedCommentsPage).toHaveBeenCalledWith(COHORT_ID, FEED_ID, { page: 1, limit: 20 });
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 3, totalPages: 1 });
  });

  it('creates a comment as the automation actor when they are a cohort member', async () => {
    mockActorAsCohortStudent();
    vi.mocked(createCohortNewsfeedCommentService).mockResolvedValue({ id: COMMENT_ID } as Awaited<
      ReturnType<typeof createCohortNewsfeedCommentService>
    >);

    await createPublicApiCohortNewsfeedCommentService(ORG_ID, ACTOR_ID, feedParams, { content: 'Nice!' });

    expect(createCohortNewsfeedCommentService).toHaveBeenCalledWith(COHORT_ID, FEED_ID, ACTOR_ID, {
      content: 'Nice!'
    });
  });

  it('refuses to create a comment when the actor is neither a member nor an org admin', async () => {
    mockActorAsOutsider();

    await expect(
      createPublicApiCohortNewsfeedCommentService(ORG_ID, ACTOR_ID, feedParams, { content: 'Nice!' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(createCohortNewsfeedCommentService).not.toHaveBeenCalled();
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
    mockActorAsCohortStudent();
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

  it("refuses to delete another member's comment when the actor is neither the author nor a team member", async () => {
    vi.mocked(getCohortNewsfeedCommentById).mockResolvedValue({
      id: COMMENT_ID,
      cohortNewsfeedId: FEED_ID,
      authorId: 'someone-elses-member-id'
    } as Awaited<ReturnType<typeof getCohortNewsfeedCommentById>>);
    vi.mocked(getCohortMemberByProfileId).mockResolvedValue({ id: ACTOR_MEMBER_ID } as Awaited<
      ReturnType<typeof getCohortMemberByProfileId>
    >);
    mockActorAsCohortStudent();

    await expect(deletePublicApiCohortNewsfeedCommentService(ORG_ID, ACTOR_ID, commentParams)).rejects.toMatchObject({
      statusCode: 403
    });
    expect(deleteCohortNewsfeedCommentService).not.toHaveBeenCalled();
  });

  it('404s deleting a comment when the post is not in this cohort, before checking permissions', async () => {
    vi.mocked(getCohortNewsfeedById).mockResolvedValue(null);
    mockActorAsOutsider();

    await expect(deletePublicApiCohortNewsfeedCommentService(ORG_ID, ACTOR_ID, commentParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(getCohortNewsfeedCommentById).not.toHaveBeenCalled();
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

    await expect(
      listPublicApiCohortNewsfeedService(ORG_ID, ACTOR_ID, cohortParams, { limit: 10 })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(listCohortNewsfeed).not.toHaveBeenCalled();
  });
});
