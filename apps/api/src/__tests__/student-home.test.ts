import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn(),
  getOrganizationPlanStatus: vi.fn(),
  getOrganizationStudentHome: vi.fn(),
  getStudentHomeCourseCandidate: vi.fn(),
  listStudentHomeCourseOptions: vi.fn(),
  getOrganizationById: vi.fn(),
  setOrganizationStudentHome: vi.fn(),
  updateOrganization: vi.fn()
}));

vi.mock('@api/services/course/access', () => ({
  canProfileOpenCourse: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({})) }
}));

vi.mock('@cio/core/config/env', () => ({
  env: { PUBLIC_IS_SELFHOSTED: 'false' }
}));

import { canProfileOpenCourse } from '@api/services/course/access';
import { updateOrg } from '@api/services/organization';
import {
  assertStudentHomeDestination,
  canSelfEnrollForFree,
  listStudentHomeOptions,
  resolveStudentHomePath
} from '@api/services/organization/student-home';
import {
  getOrganizationById,
  getOrganizationMemberRoleId,
  getOrganizationPlanStatus,
  getOrganizationStudentHome,
  getStudentHomeCourseCandidate,
  listStudentHomeCourseOptions,
  setOrganizationStudentHome,
  updateOrganization
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';

const ORG_ID = 'org-1';
const PROFILE_ID = 'profile-1';
const COURSE_ID = 'course-1';

function paidPlans() {
  return [{ planName: 'ENTERPRISE', isActive: true }];
}

function openCourse(overrides = {}) {
  return {
    id: COURSE_ID,
    slug: 'soc2-security',
    type: 'SELF_PACED',
    status: 'ACTIVE',
    isPublished: true,
    isTemplate: false,
    cost: 0,
    metadata: {},
    ...overrides
  };
}

describe('assertStudentHomeDestination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationPlanStatus).mockResolvedValue(paidPlans() as never);
  });

  it('clears both columns for null', async () => {
    await expect(assertStudentHomeDestination(ORG_ID, null, null, {} as never)).resolves.toEqual({
      path: null,
      courseId: null
    });
  });

  it('accepts an available page', async () => {
    await expect(
      assertStudentHomeDestination(ORG_ID, { type: 'page', key: 'mylearning' }, null, {} as never)
    ).resolves.toEqual({ path: '/lms/mylearning', courseId: null });
  });

  it('rejects a page unavailable under the effective customization', async () => {
    await expect(
      assertStudentHomeDestination(ORG_ID, { type: 'page', key: 'exercises' }, null, {} as never)
    ).rejects.toMatchObject({ statusCode: 400, code: 'STUDENT_HOME_UNAVAILABLE', field: 'studentHome' });
  });

  it('accepts a page enabled by the same-request customization', async () => {
    await expect(
      assertStudentHomeDestination(
        ORG_ID,
        { type: 'page', key: 'community' },
        { dashboard: { community: true } },
        {} as never
      )
    ).resolves.toEqual({ path: '/lms/community', courseId: null });
  });

  it('accepts a valid course', async () => {
    vi.mocked(getStudentHomeCourseCandidate).mockResolvedValue(openCourse() as never);

    await expect(
      assertStudentHomeDestination(ORG_ID, { type: 'course', courseId: COURSE_ID }, null, {} as never)
    ).resolves.toEqual({ path: null, courseId: COURSE_ID });
  });

  it('rejects unknown and cross-org courses with the same error', async () => {
    vi.mocked(getStudentHomeCourseCandidate).mockResolvedValue(null);

    for (const courseId of ['missing-course', 'other-org-course']) {
      await expect(
        assertStudentHomeDestination(ORG_ID, { type: 'course', courseId }, null, {} as never)
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'STUDENT_HOME_INVALID_COURSE',
        field: 'studentHome',
        message: 'This course cannot be used as the student home'
      });
    }

    expect(getStudentHomeCourseCandidate).toHaveBeenCalledWith(ORG_ID, 'other-org-course', {});
  });
});

describe('resolveStudentHomePath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.STUDENT);
    vi.mocked(canProfileOpenCourse).mockResolvedValue(false);
  });

  it('returns null for staff and non-members without extra reads', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);

    await expect(resolveStudentHomePath(ORG_ID, PROFILE_ID)).resolves.toBeNull();
    expect(getOrganizationStudentHome).not.toHaveBeenCalled();
  });

  it('returns null when the setting is unset', async () => {
    vi.mocked(getOrganizationStudentHome).mockResolvedValue({
      studentHomePath: null,
      studentHomeCourseId: null,
      customization: null,
      plans: []
    } as never);

    await expect(resolveStudentHomePath(ORG_ID, PROFILE_ID)).resolves.toBeNull();
  });

  it('resolves an available page', async () => {
    vi.mocked(getOrganizationStudentHome).mockResolvedValue({
      studentHomePath: '/lms/mylearning',
      studentHomeCourseId: null,
      customization: null,
      plans: []
    } as never);

    await expect(resolveStudentHomePath(ORG_ID, PROFILE_ID)).resolves.toBe('/lms/mylearning');
  });

  it('falls back for unavailable and unknown pages', async () => {
    for (const studentHomePath of ['/lms/certificates', '/lms/exercises', '/removed-page']) {
      vi.mocked(getOrganizationStudentHome).mockResolvedValue({
        studentHomePath,
        studentHomeCourseId: null,
        customization: null,
        plans: []
      } as never);

      await expect(resolveStudentHomePath(ORG_ID, PROFILE_ID)).resolves.toBe('/lms');
    }
  });

  it('sends students who can open the course to their next lesson', async () => {
    vi.mocked(getOrganizationStudentHome).mockResolvedValue({
      studentHomePath: null,
      studentHomeCourseId: COURSE_ID,
      customization: null,
      plans: []
    } as never);
    vi.mocked(getStudentHomeCourseCandidate).mockResolvedValue(openCourse() as never);
    vi.mocked(canProfileOpenCourse).mockResolvedValue(true);

    await expect(resolveStudentHomePath(ORG_ID, PROFILE_ID)).resolves.toBe(`/courses/${COURSE_ID}/lessons?next=true`);
  });

  it('sends students to the public course route for PUBLIC courses', async () => {
    vi.mocked(getOrganizationStudentHome).mockResolvedValue({
      studentHomePath: null,
      studentHomeCourseId: COURSE_ID,
      customization: null,
      plans: []
    } as never);
    vi.mocked(getStudentHomeCourseCandidate).mockResolvedValue(openCourse({ type: 'PUBLIC' }) as never);

    await expect(resolveStudentHomePath(ORG_ID, PROFILE_ID)).resolves.toBe('/course/soc2-security');
  });

  it('sends non-enrolled students to the join screen for free open courses', async () => {
    vi.mocked(getOrganizationStudentHome).mockResolvedValue({
      studentHomePath: null,
      studentHomeCourseId: COURSE_ID,
      customization: null,
      plans: []
    } as never);
    vi.mocked(getStudentHomeCourseCandidate).mockResolvedValue(openCourse() as never);

    await expect(resolveStudentHomePath(ORG_ID, PROFILE_ID)).resolves.toBe(
      '/course/soc2-security/enroll?from=student-home'
    );
  });

  it('falls back for paid, invite-only and broken courses', async () => {
    vi.mocked(getOrganizationStudentHome).mockResolvedValue({
      studentHomePath: null,
      studentHomeCourseId: COURSE_ID,
      customization: null,
      plans: []
    } as never);

    const cases = [
      openCourse({ cost: 100 }),
      openCourse({ metadata: { paymentEnabled: true } }),
      openCourse({ metadata: { allowSelfEnrollment: false } }),
      openCourse({ isPublished: false }),
      openCourse({ isTemplate: true }),
      openCourse({ status: 'DELETED' })
    ];

    for (const course of cases) {
      vi.mocked(getStudentHomeCourseCandidate).mockResolvedValue(course as never);
      await expect(resolveStudentHomePath(ORG_ID, PROFILE_ID)).resolves.toBe('/lms');
    }

    vi.mocked(getStudentHomeCourseCandidate).mockResolvedValue(null);
    await expect(resolveStudentHomePath(ORG_ID, PROFILE_ID)).resolves.toBe('/lms');
  });

  it('falls back for courses without a slug', async () => {
    vi.mocked(getOrganizationStudentHome).mockResolvedValue({
      studentHomePath: null,
      studentHomeCourseId: COURSE_ID,
      customization: null,
      plans: []
    } as never);

    for (const course of [openCourse({ type: 'PUBLIC', slug: null }), openCourse({ slug: null })]) {
      vi.mocked(getStudentHomeCourseCandidate).mockResolvedValue(course as never);
      await expect(resolveStudentHomePath(ORG_ID, PROFILE_ID)).resolves.toBe('/lms');
    }
  });
});

describe('canSelfEnrollForFree', () => {
  it('treats an unset flag as open and honours the legacy key', () => {
    expect(canSelfEnrollForFree(openCourse() as never)).toBe(true);
    expect(canSelfEnrollForFree(openCourse({ metadata: { allowNewStudent: true } }) as never)).toBe(true);
    expect(canSelfEnrollForFree(openCourse({ metadata: { allowSelfEnrollment: false } }) as never)).toBe(false);
  });

  it('treats paid courses as restricted even when self-enrollment is open', () => {
    expect(canSelfEnrollForFree(openCourse({ cost: 50 }) as never)).toBe(false);
    expect(canSelfEnrollForFree(openCourse({ metadata: { paymentEnabled: true } }) as never)).toBe(false);
  });
});

describe('listStudentHomeOptions', () => {
  it('maps rows to picker options with availability flags', async () => {
    vi.mocked(listStudentHomeCourseOptions).mockResolvedValue([
      { ...openCourse(), title: 'Open course' },
      { ...openCourse(), id: 'paid-1', title: 'Paid course', cost: 100 }
    ] as never);

    await expect(listStudentHomeOptions(ORG_ID, {})).resolves.toEqual([
      { id: COURSE_ID, title: 'Open course', type: 'SELF_PACED', isAvailable: true, canSelfEnroll: true },
      { id: 'paid-1', title: 'Paid course', type: 'SELF_PACED', isAvailable: true, canSelfEnroll: false }
    ]);
  });
});

describe('updateOrg student home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationById).mockResolvedValue({ id: ORG_ID, customization: null } as never);
    vi.mocked(getOrganizationPlanStatus).mockResolvedValue(paidPlans() as never);
    vi.mocked(updateOrganization).mockResolvedValue({ id: ORG_ID, name: 'Valid Name' } as never);
  });

  it('saves the destination and the org in one transaction', async () => {
    vi.mocked(getStudentHomeCourseCandidate).mockResolvedValue(openCourse() as never);

    await updateOrg(ORG_ID, { name: 'Valid Name', studentHome: { type: 'page', key: 'mylearning' } });

    expect(setOrganizationStudentHome).toHaveBeenCalledWith(ORG_ID, { path: '/lms/mylearning', courseId: null }, {});
    expect(updateOrganization).toHaveBeenCalledWith(ORG_ID, { name: 'Valid Name' }, {});
  });

  it('persists nothing when the destination is invalid', async () => {
    vi.mocked(getStudentHomeCourseCandidate).mockResolvedValue(null);

    await expect(
      updateOrg(ORG_ID, { name: 'Valid Name', studentHome: { type: 'course', courseId: 'missing' } })
    ).rejects.toMatchObject({ code: 'STUDENT_HOME_INVALID_COURSE' });

    expect(setOrganizationStudentHome).not.toHaveBeenCalled();
    expect(updateOrganization).not.toHaveBeenCalled();
  });
});
