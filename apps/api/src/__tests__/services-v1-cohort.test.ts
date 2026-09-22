import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortOrganizationId: vi.fn(),
  getCohortsByOrg: vi.fn(),
  getCoursesByCohort: vi.fn(),
  getCohortMemberRole: vi.fn(),
  isOrgAdminByCohortId: vi.fn(),
  getCohortMemberByProfileId: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@api/services/cohort/cohort', () => ({
  createCohort: vi.fn(),
  getCohort: vi.fn(),
  updateCohort: vi.fn(),
  deleteCohort: vi.fn(),
  listCohortMembers: vi.fn(),
  addCohortMembers: vi.fn(),
  updateCohortMemberService: vi.fn(),
  removeCohortMemberService: vi.fn(),
  addCourseToCohortService: vi.fn(),
  removeCourseFromCohortService: vi.fn()
}));

import {
  getCohortMemberRole,
  getCohortOrganizationId,
  getCohortsByOrg,
  getCoursesByCohort,
  isOrgAdminByCohortId
} from '@cio/db/queries/cohort';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import {
  addCohortMembers,
  addCourseToCohortService,
  createCohort,
  deleteCohort,
  getCohort,
  listCohortMembers,
  removeCohortMemberService,
  removeCourseFromCohortService,
  updateCohort,
  updateCohortMemberService
} from '@api/services/cohort/cohort';
import { assertCohortBelongsToOrganization } from '@api/services/v1/shared';
import { ROLE } from '@cio/utils/constants';
import {
  createPublicApiCohortService,
  deletePublicApiCohortService,
  getPublicApiCohortService,
  listCohortsService,
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

const cohortParams = { cohortId: COHORT_ID };

/** Default happy path: actor is a cohort tutor, so the team-or-admin gate passes. */
function mockActorAsCohortTeamMember() {
  vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.TUTOR);
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

describe('v1 cohort service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    mockActorAsCohortTeamMember();
  });

  it('lists cohorts for the organization without a per-profile filter', async () => {
    vi.mocked(getCohortsByOrg).mockResolvedValue([]);

    await listCohortsService(ORG_ID);

    expect(getCohortsByOrg).toHaveBeenCalledWith(ORG_ID);
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

  it('gets a cohort with no team-membership requirement (read-only)', async () => {
    vi.mocked(getCohort).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof getCohort>>);

    await getPublicApiCohortService(ORG_ID, cohortParams);

    expect(getCohort).toHaveBeenCalledWith(COHORT_ID);
  });

  it('updates and deletes a cohort once the actor is confirmed a cohort team member', async () => {
    vi.mocked(updateCohort).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof updateCohort>>);
    vi.mocked(deleteCohort).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof deleteCohort>>);

    await updatePublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams, { name: 'Renamed' });
    await deletePublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams);

    expect(updateCohort).toHaveBeenCalledWith(COHORT_ID, { name: 'Renamed' });
    expect(deleteCohort).toHaveBeenCalledWith(COHORT_ID);
  });

  it('refuses to update/delete a cohort when the actor is not a team member or org admin', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);

    await expect(
      updatePublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams, { name: 'Renamed' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(updateCohort).not.toHaveBeenCalled();
  });

  it('allows update/delete when the actor is an org admin, even without a cohort role', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(null);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(true);
    vi.mocked(deleteCohort).mockResolvedValue({ id: COHORT_ID } as Awaited<ReturnType<typeof deleteCohort>>);

    await deletePublicApiCohortService(ORG_ID, ACTOR_ID, cohortParams);

    expect(deleteCohort).toHaveBeenCalledWith(COHORT_ID);
  });

  it('rejects update with no automation actor', async () => {
    await expect(
      updatePublicApiCohortService(ORG_ID, null, cohortParams, { name: 'Renamed' })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(updateCohort).not.toHaveBeenCalled();
  });

  it('refuses to touch a cohort from another organization', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(OTHER_ORG_ID);

    await expect(getPublicApiCohortService(ORG_ID, cohortParams)).rejects.toMatchObject({ statusCode: 404 });
    expect(getCohort).not.toHaveBeenCalled();
  });
});

describe('v1 cohort member service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    mockActorAsCohortTeamMember();
  });

  it('lists members with no team-membership requirement (read-only)', async () => {
    vi.mocked(listCohortMembers).mockResolvedValue([]);

    await listPublicApiCohortMembersService(ORG_ID, cohortParams);

    expect(listCohortMembers).toHaveBeenCalledWith(COHORT_ID);
  });

  it('adds members once the actor is confirmed a cohort team member', async () => {
    vi.mocked(addCohortMembers).mockResolvedValue({ added: [], errors: [] });

    await addPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, {
      members: [{ email: 'student@example.com', roleId: 3 }]
    });

    expect(addCohortMembers).toHaveBeenCalledWith(COHORT_ID, {
      members: [{ email: 'student@example.com', roleId: 3 }]
    });
  });

  it('refuses to add members when the actor is not a team member or org admin', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);

    await expect(
      addPublicApiCohortMembersService(ORG_ID, ACTOR_ID, cohortParams, {
        members: [{ email: 'student@example.com', roleId: 3 }]
      })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(addCohortMembers).not.toHaveBeenCalled();
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

    await expect(listPublicApiCohortMembersService(ORG_ID, cohortParams)).rejects.toMatchObject({ statusCode: 404 });
    expect(listCohortMembers).not.toHaveBeenCalled();
  });
});

describe('v1 cohort course service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_ID);
    mockActorAsCohortTeamMember();
  });

  it('lists all cohort courses, including unpublished ones, with no team-membership requirement', async () => {
    vi.mocked(getCoursesByCohort).mockResolvedValue([]);

    await listPublicApiCohortCoursesService(ORG_ID, cohortParams);

    expect(getCoursesByCohort).toHaveBeenCalledWith(COHORT_ID, false);
  });

  it('adds a course that belongs to the same organization once the actor is a team member', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(addCourseToCohortService).mockResolvedValue({ courseId: COURSE_ID } as Awaited<
      ReturnType<typeof addCourseToCohortService>
    >);

    await addPublicApiCohortCourseService(ORG_ID, ACTOR_ID, cohortParams, { courseId: COURSE_ID });

    expect(addCourseToCohortService).toHaveBeenCalledWith(COHORT_ID, { courseId: COURSE_ID });
  });

  it('refuses to add a course when the actor is not a team member or org admin', async () => {
    vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);
    vi.mocked(isOrgAdminByCohortId).mockResolvedValue(false);

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
