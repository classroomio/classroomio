import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortOrganizationId: vi.fn(),
  getCohortMemberRole: vi.fn(),
  isCohortMember: vi.fn(),
  isOrgAdminByCohortId: vi.fn(),
  getCohortMemberByProfileId: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@api/services/cohort/cohort', () => ({
  createCohort: vi.fn(),
  getCohort: vi.fn(),
  updateCohort: vi.fn(),
  deleteCohort: vi.fn(),
  listOrgCohortsPage: vi.fn(),
  listCohortMembersPage: vi.fn(),
  listCohortCoursesPage: vi.fn(),
  addCohortMembersSettled: vi.fn(),
  getEnrolledCohorts: vi.fn(),
  updateCohortMemberService: vi.fn(),
  removeCohortMemberService: vi.fn(),
  addCourseToCohortService: vi.fn(),
  removeCourseFromCohortService: vi.fn()
}));

import {
  getCohortMemberRole,
  getCohortOrganizationId,
  isCohortMember,
  isOrgAdminByCohortId
} from '@cio/db/queries/cohort';
import { getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import {
  addCohortMembersSettled,
  addCourseToCohortService,
  createCohort,
  deleteCohort,
  getCohort,
  getEnrolledCohorts,
  listCohortCoursesPage,
  listCohortMembersPage,
  listOrgCohortsPage,
  removeCohortMemberService,
  removeCourseFromCohortService,
  updateCohort,
  updateCohortMemberService
} from '@api/services/cohort/cohort';
import { assertCohortBelongsToOrganization, toPublicApiPagination } from '@api/services/v1/shared';
import { ROLE } from '@cio/utils/constants';
import {
  createPublicApiCohortService,
  deletePublicApiCohortService,
  getPublicApiCohortService,
  listCohortsService,
  listPublicApiEnrolledCohortsService,
  updatePublicApiCohortService
} from '@api/services/v1/cohort';
import {
  addPublicApiCohortMembersService,
  listPublicApiCohortMembersService,
  removePublicApiCohortMemberService,
  updatePublicApiCohortMemberService
} from '@api/services/v1/cohort-member';
import {
  addPublicApiCohortCourseService,
  listPublicApiCohortCoursesService,
  removePublicApiCohortCourseService
} from '@api/services/v1/cohort-course';
import { AppError } from '@api/utils/errors';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const COHORT_ID = 'cohort-1';
const MEMBER_ID = 'member-1';
const COURSE_ID = 'course-1';
const ACTOR_ID = 'actor-1';
const PROFILE_ID = 'profile-1';

const cohortParams = { cohortId: COHORT_ID };
const firstPage = { page: 1, limit: 20 };

function mockActorAsCohortTutor() {
  vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.TUTOR);
  vi.mocked(isCohortMember).mockResolvedValue(true);
  vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
}

function mockActorAsOutsider() {
  vi.mocked(getCohortMemberRole).mockResolvedValue(null);
  vi.mocked(isCohortMember).mockResolvedValue(false);
  vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);
}

describe('assertCohortBelongsToOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when the cohort belongs to the organization', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);

    await expect(assertCohortBelongsToOrganization(ORG_ID, COHORT_ID)).resolves.toBeUndefined();
  });

  it('throws a 404 AppError when the cohort belongs to another organization', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(assertCohortBelongsToOrganization(ORG_ID, COHORT_ID)).rejects.toMatchObject({
      statusCode: 404
    });
  });

  it('throws a 404 AppError when the cohort does not exist', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(null);

    await expect(assertCohortBelongsToOrganization(ORG_ID, COHORT_ID)).rejects.toBeInstanceOf(AppError);
  });
});

describe('toPublicApiPagination', () => {
  it('rounds totalPages up and reports 0 pages for an empty list', () => {
    expect(toPublicApiPagination(2, 20, 41)).toEqual({ page: 2, limit: 20, total: 41, totalPages: 3 });
    expect(toPublicApiPagination(1, 20, 0)).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
  });
});

describe('v1 cohort service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    mockActorAsCohortTutor();
  });

  it('lists only the cohorts the actor can see, like the dashboard', async () => {
    vi.mocked(listOrgCohortsPage).mockResolvedValue({ items: [], total: 0 });

    const result = await listCohortsService(ORG_ID, ACTOR_ID, firstPage);

    expect(listOrgCohortsPage).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, firstPage);
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
  });

  it('rejects listing cohorts with no automation actor', async () => {
    await expect(listCohortsService(ORG_ID, null, firstPage)).rejects.toMatchObject({ statusCode: 401 });
    expect(listOrgCohortsPage).not.toHaveBeenCalled();
  });

  it('creates a cohort using the automation actor as the creator', async () => {
    vi.mocked(createCohort).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof createCohort>>);

    await createPublicApiCohortService(ORG_ID, ACTOR_ID, { name: 'Cohort A' });

    expect(createCohort).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, { name: 'Cohort A' });
  });

  it('rejects creating a cohort with no automation actor', async () => {
    await expect(createPublicApiCohortService(ORG_ID, null, { name: 'Cohort A' })).rejects.toMatchObject({
      statusCode: 401
    });
    expect(createCohort).not.toHaveBeenCalled();
  });

  it('gets a cohort when the actor is a cohort member', async () => {
    vi.mocked(getCohort).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof getCohort>>);

    await getPublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams);

    expect(getCohort).toHaveBeenCalledWith(COHORT_ID);
  });

  it('refuses to get a cohort when the actor is neither a member nor an org admin', async () => {
    mockActorAsOutsider();

    await expect(getPublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams)).rejects.toMatchObject({
      statusCode: 403
    });
    expect(getCohort).not.toHaveBeenCalled();
  });

  it('lets an org admin read a cohort they are not a member of', async () => {
    mockActorAsOutsider();
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(true);
    vi.mocked(getCohort).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof getCohort>>);

    await getPublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams);

    expect(getCohort).toHaveBeenCalledWith(COHORT_ID);
  });

  it('rejects reading a cohort with no automation actor', async () => {
    await expect(getPublicApiCohortService(ORG_ID, null, cohortParams)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('updates and deletes a cohort once the actor is confirmed a cohort team member', async () => {
    vi.mocked(updateCohort).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof updateCohort>>);
    vi.mocked(deleteCohort).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof deleteCohort>>);

    await updatePublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams, { name: 'Renamed' });
    await deletePublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams);

    expect(updateCohort).toHaveBeenCalledWith(COHORT_ID, { name: 'Renamed' });
    expect(deleteCohort).toHaveBeenCalledWith(COHORT_ID);
  });

  it('refuses to update a cohort when the actor is a student in it', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);

    await expect(
      updatePublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams, { name: 'Renamed' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(updateCohort).not.toHaveBeenCalled();
  });

  it('allows delete when the actor is an org admin, even without a cohort role', async () => {
    mockActorAsOutsider();
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(true);
    vi.mocked(deleteCohort).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof deleteCohort>>);

    await deletePublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams);

    expect(deleteCohort).toHaveBeenCalledWith(COHORT_ID);
  });

  it('rejects update with no automation actor', async () => {
    await expect(updatePublicApiCohortService(ORG_ID, null, cohortParams, { name: 'Renamed' })).rejects.toMatchObject({
      statusCode: 401
    });
    expect(updateCohort).not.toHaveBeenCalled();
  });

  it('refuses to touch a cohort from another organization', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(getPublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(getCohort).not.toHaveBeenCalled();
  });
});

describe('v1 enrolled cohorts service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only the actor's cohorts in the key's organization", async () => {
    vi.mocked(getEnrolledCohorts).mockResolvedValue([
      { id: 'cohort-a', organizationId: ORG_ID },
      { id: 'cohort-b', organizationId: OTHER_ORG_ID }
    ] as Awaited<ReturnType<typeof getEnrolledCohorts>>);

    const result = await listPublicApiEnrolledCohortsService(ORG_ID, ACTOR_ID, firstPage);

    expect(getEnrolledCohorts).toHaveBeenCalledWith(ACTOR_ID);
    expect(result.items.map((cohort) => cohort.id)).toEqual(['cohort-a']);
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it('rejects listing enrolled cohorts with no automation actor', async () => {
    await expect(listPublicApiEnrolledCohortsService(ORG_ID, null, firstPage)).rejects.toMatchObject({
      statusCode: 401
    });
    expect(getEnrolledCohorts).not.toHaveBeenCalled();
  });
});

describe('v1 cohort member service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(1);
    mockActorAsCohortTutor();
  });

  it('lists members a page at a time when the actor is a cohort member', async () => {
    vi.mocked(listCohortMembersPage).mockResolvedValue({ items: [], total: 45 });

    const result = await listPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, { page: 2, limit: 20 });

    expect(listCohortMembersPage).toHaveBeenCalledWith(COHORT_ID, { page: 2, limit: 20 });
    expect(result.pagination).toEqual({ page: 2, limit: 20, total: 45, totalPages: 3 });
  });

  it('refuses to list members when the actor is neither a member nor an org admin', async () => {
    mockActorAsOutsider();

    await expect(listPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, firstPage)).rejects.toMatchObject({
      statusCode: 403
    });
    expect(listCohortMembersPage).not.toHaveBeenCalled();
  });

  it('adds members by email without an organization check, like the dashboard', async () => {
    vi.mocked(addCohortMembersSettled).mockResolvedValue([]);
    const payload = { members: [{ email: 'student@example.com', roleId: 3 as const }] };

    await addPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, payload);

    expect(getOrganizationMemberIdByOrgAndProfile).not.toHaveBeenCalled();
    expect(addCohortMembersSettled).toHaveBeenCalledWith(COHORT_ID, payload);
  });

  it('adds members by profileId when the profile belongs to the organization', async () => {
    vi.mocked(addCohortMembersSettled).mockResolvedValue([]);
    const payload = { members: [{ profileId: PROFILE_ID, roleId: 3 as const }] };

    await addPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, payload);

    expect(getOrganizationMemberIdByOrgAndProfile).toHaveBeenCalledWith(ORG_ID, PROFILE_ID);
    expect(addCohortMembersSettled).toHaveBeenCalledWith(COHORT_ID, payload);
  });

  it('refuses to add a profileId from another organization', async () => {
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null);

    await expect(
      addPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, {
        members: [
          { email: 'student@example.com', roleId: 3 },
          { profileId: PROFILE_ID, roleId: 3 }
        ]
      })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(addCohortMembersSettled).not.toHaveBeenCalled();
  });

  it('reports each failed entry with its index, identifiers, and error code, in request order', async () => {
    const added = { id: MEMBER_ID };
    vi.mocked(addCohortMembersSettled).mockResolvedValue([
      { status: 'rejected', reason: new AppError('already a member', 'MEMBER_ALREADY_IN_COHORT', 409) },
      { status: 'fulfilled', value: added as never },
      { status: 'rejected', reason: new Error('db exploded') }
    ]);
    const payload = {
      members: [
        { email: 'existing@example.com', roleId: 3 as const },
        { email: 'new@example.com', roleId: 3 as const },
        { profileId: PROFILE_ID, roleId: 2 as const }
      ]
    };

    const result = await addPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, payload);

    expect(result).toEqual({
      added: [added],
      errors: [
        {
          index: 0,
          email: 'existing@example.com',
          profileId: null,
          code: 'MEMBER_ALREADY_IN_COHORT',
          message: 'already a member'
        },
        { index: 2, email: null, profileId: PROFILE_ID, code: 'INTERNAL_ERROR', message: 'Failed to add this member' }
      ]
    });
  });

  it('does not expose internal error details, including server-side AppErrors, in per-entry errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(addCohortMembersSettled).mockResolvedValue([
      { status: 'rejected', reason: new Error('duplicate key value violates unique constraint "cohort_member_pkey"') },
      { status: 'rejected', reason: new AppError('connection terminated', 'INTERNAL_ERROR', 500) }
    ]);

    const result = await addPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, {
      members: [
        { email: 'a@example.com', roleId: 3 },
        { email: 'b@example.com', roleId: 3 }
      ]
    });

    expect(result.errors.map(({ code, message }) => ({ code, message }))).toEqual([
      { code: 'INTERNAL_ERROR', message: 'Failed to add this member' },
      { code: 'INTERNAL_ERROR', message: 'Failed to add this member' }
    ]);
    expect(JSON.stringify(result)).not.toContain('cohort_member_pkey');
    expect(JSON.stringify(result)).not.toContain('connection terminated');
  });

  it('retrying the same request reports every entry as already a member instead of duplicating', async () => {
    vi.mocked(addCohortMembersSettled).mockResolvedValue([
      { status: 'rejected', reason: new AppError('already a member', 'MEMBER_ALREADY_IN_COHORT', 409) }
    ]);

    const result = await addPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, {
      members: [{ email: 'student@example.com', roleId: 3 }]
    });

    expect(result.added).toEqual([]);
    expect(result.errors).toEqual([expect.objectContaining({ index: 0, code: 'MEMBER_ALREADY_IN_COHORT' })]);
  });

  it('refuses to add members when the actor is a student in the cohort', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);

    await expect(
      addPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, {
        members: [{ email: 'student@example.com', roleId: 3 }]
      })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(addCohortMembersSettled).not.toHaveBeenCalled();
  });

  it('updates and removes a member by cohortId + memberId once the actor is a team member', async () => {
    vi.mocked(updateCohortMemberService).mockResolvedValue({ id: MEMBER_ID } as Awaited<
      ReturnType<typeof updateCohortMemberService>
    >);
    vi.mocked(removeCohortMemberService).mockResolvedValue({ id: MEMBER_ID } as Awaited<
      ReturnType<typeof removeCohortMemberService>
    >);

    await updatePublicApiCohortMemberService(
      ORG_ID,
      ACTOR_ID,
      { cohortId: COHORT_ID, memberId: MEMBER_ID },
      { roleId: 2 }
    );
    await removePublicApiCohortMemberService(ORG_ID, ACTOR_ID, { cohortId: COHORT_ID, memberId: MEMBER_ID });

    expect(updateCohortMemberService).toHaveBeenCalledWith(COHORT_ID, MEMBER_ID, { roleId: 2 });
    expect(removeCohortMemberService).toHaveBeenCalledWith(COHORT_ID, MEMBER_ID);
  });

  it('refuses to touch members of a cohort from another organization', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(listPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, firstPage)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(listCohortMembersPage).not.toHaveBeenCalled();
  });
});

describe('v1 cohort course service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    mockActorAsCohortTutor();
  });

  it('lists cohort courses through the dashboard visibility rule for the actor', async () => {
    vi.mocked(listCohortCoursesPage).mockResolvedValue({ items: [], total: 0 });

    await listPublicApiCohortCoursesService(ORG_ID, ACTOR_ID, cohortParams, firstPage);

    expect(listCohortCoursesPage).toHaveBeenCalledWith(COHORT_ID, ACTOR_ID, firstPage);
  });

  it('refuses to list cohort courses when the actor is neither a member nor an org admin', async () => {
    mockActorAsOutsider();

    await expect(listPublicApiCohortCoursesService(ORG_ID, ACTOR_ID, cohortParams, firstPage)).rejects.toMatchObject({
      statusCode: 403
    });
    expect(listCohortCoursesPage).not.toHaveBeenCalled();
  });

  it('adds a course that belongs to the same organization once the actor is a team member', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(addCourseToCohortService).mockResolvedValue({ courseId: COURSE_ID } as Awaited<
      ReturnType<typeof addCourseToCohortService>
    >);

    await addPublicApiCohortCourseService(ORG_ID, ACTOR_ID, cohortParams, { courseId: COURSE_ID });

    expect(addCourseToCohortService).toHaveBeenCalledWith(COHORT_ID, { courseId: COURSE_ID });
  });

  it('refuses to add a course when the actor is a student in the cohort', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);

    await expect(
      addPublicApiCohortCourseService(ORG_ID, ACTOR_ID, cohortParams, { courseId: COURSE_ID })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(addCourseToCohortService).not.toHaveBeenCalled();
  });

  it('refuses to link a course from another organization to the cohort', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(
      addPublicApiCohortCourseService(ORG_ID, ACTOR_ID, cohortParams, { courseId: COURSE_ID })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(addCourseToCohortService).not.toHaveBeenCalled();
  });

  it('passes a 409 through when the course is already linked to the cohort', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(addCourseToCohortService).mockRejectedValue(
      new AppError('Course already in cohort', 'COURSE_ALREADY_IN_COHORT', 409)
    );

    await expect(
      addPublicApiCohortCourseService(ORG_ID, ACTOR_ID, cohortParams, { courseId: COURSE_ID })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('refuses to link a course that does not exist', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue(null);

    await expect(
      addPublicApiCohortCourseService(ORG_ID, ACTOR_ID, cohortParams, { courseId: COURSE_ID })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(addCourseToCohortService).not.toHaveBeenCalled();
  });

  it('removes a course from a cohort once the actor is a team member', async () => {
    vi.mocked(removeCourseFromCohortService).mockResolvedValue({ courseId: COURSE_ID } as Awaited<
      ReturnType<typeof removeCourseFromCohortService>
    >);

    await removePublicApiCohortCourseService(ORG_ID, ACTOR_ID, { cohortId: COHORT_ID, courseId: COURSE_ID });

    expect(removeCourseFromCohortService).toHaveBeenCalledWith(COHORT_ID, COURSE_ID);
  });
});
