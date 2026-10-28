import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortOrganizationId: vi.fn(),
  getCohortMemberRole: vi.fn()
}));
vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));
vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));
vi.mock('@cio/db/queries/insights', () => ({
  listInsightsScopeCourseIds: vi.fn().mockResolvedValue([])
}));

import { getCohortMemberRole, getCohortOrganizationId } from '@cio/db/queries/cohort';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { listInsightsScopeCourseIds } from '@cio/db/queries/insights';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { ROLE } from '@cio/utils/constants';

import { resolveAuthorizedScope } from '@api/services/insights/authorize';

const ORG_A = '11111111-1111-4111-8111-111111111111';
const ORG_B = '22222222-2222-4222-8222-222222222222';
const COHORT_ID = '33333333-3333-4333-8333-333333333333';
const COURSE_ID = '44444444-4444-4444-8444-444444444444';

const admin = {
  profileId: '55555555-5555-4555-8555-555555555555',
  orgId: ORG_A,
  orgRoles: { [ORG_A]: ROLE.ADMIN }
};

const tutor = {
  profileId: '66666666-6666-4666-8666-666666666666',
  orgId: ORG_A,
  orgRoles: { [ORG_A]: ROLE.TUTOR }
};

const student = {
  profileId: '77777777-7777-4777-8777-777777777777',
  orgId: ORG_A,
  orgRoles: { [ORG_A]: ROLE.STUDENT }
};

describe('resolveAuthorizedScope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listInsightsScopeCourseIds).mockResolvedValue([COURSE_ID]);
  });

  describe('cohort scope', () => {
    it('hides a cohort from another org as not found', async () => {
      vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_B);

      await expect(resolveAuthorizedScope(tutor, { type: 'cohort', id: COHORT_ID })).rejects.toMatchObject({
        statusCode: 404
      });
    });

    it('forbids a cohort the tutor does not staff', async () => {
      vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_A);
      vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.STUDENT);

      await expect(resolveAuthorizedScope(tutor, { type: 'cohort', id: COHORT_ID })).rejects.toMatchObject({
        statusCode: 403
      });
    });

    it('allows a cohort tutor and returns course ids', async () => {
      vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_A);
      vi.mocked(getCohortMemberRole).mockResolvedValue(ROLE.TUTOR);

      const scope = await resolveAuthorizedScope(tutor, { type: 'cohort', id: COHORT_ID });

      expect(scope).toEqual({
        orgId: ORG_A,
        type: 'cohort',
        id: COHORT_ID,
        courseIds: [COURSE_ID]
      });
    });

    it('allows an org admin even if not in the cohort team', async () => {
      vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_A);

      const scope = await resolveAuthorizedScope(admin, { type: 'cohort', id: COHORT_ID });

      expect(scope.id).toBe(COHORT_ID);
      expect(getCohortMemberRole).not.toHaveBeenCalled();
    });
  });

  describe('org scope', () => {
    it('forbids the org scope to anyone but an org admin', async () => {
      await expect(resolveAuthorizedScope(tutor, { type: 'org', id: ORG_A })).rejects.toMatchObject({
        statusCode: 403
      });
      await expect(resolveAuthorizedScope(student, { type: 'org', id: ORG_A })).rejects.toMatchObject({
        statusCode: 403
      });
    });

    it('returns not found if org id does not match actor org id', async () => {
      await expect(resolveAuthorizedScope(admin, { type: 'org', id: ORG_B })).rejects.toMatchObject({
        statusCode: 404
      });
    });

    it('allows org admin for matching org id', async () => {
      const scope = await resolveAuthorizedScope(admin, { type: 'org', id: ORG_A });

      expect(scope).toEqual({
        orgId: ORG_A,
        type: 'org',
        id: ORG_A,
        courseIds: [COURSE_ID]
      });
    });
  });

  describe('course scope', () => {
    it('returns 404 when course is not in the actor org', async () => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_B);

      await expect(resolveAuthorizedScope(admin, { type: 'course', id: COURSE_ID })).rejects.toMatchObject({
        statusCode: 404
      });
    });

    it('returns 403 when user is not course team member or org admin', async () => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_A);
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(resolveAuthorizedScope(student, { type: 'course', id: COURSE_ID })).rejects.toMatchObject({
        statusCode: 403
      });
    });

    it('allows course team member', async () => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_A);
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);

      const scope = await resolveAuthorizedScope(tutor, { type: 'course', id: COURSE_ID });

      expect(scope).toEqual({
        orgId: ORG_A,
        type: 'course',
        id: COURSE_ID,
        courseIds: [COURSE_ID]
      });
    });
  });
});
