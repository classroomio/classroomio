import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/organization', () => ({ getOrganizationMemberRoleId: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseById: vi.fn(), isCourseSlugTaken: vi.fn() }));
vi.mock('@cio/core/services/course/course', () => ({}));
vi.mock('@api/services/course-import/course-import', () => ({}));
vi.mock('@api/services/course/people', () => ({}));
vi.mock('@api/services/course/certificate-plan', () => ({}));
vi.mock('@api/services/course/clone', () => ({ cloneCourse: vi.fn() }));
vi.mock('@api/services/organization', () => ({ getOrganizationCourses: vi.fn(), reorderOrgCourses: vi.fn() }));

import { ROLE } from '@cio/utils/constants';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getCourseById, isCourseSlugTaken } from '@cio/db/queries/course';
import { cloneCourse } from '@api/services/course/clone';
import { reorderOrgCourses } from '@api/services/organization';
import { clonePublicApiCourseService, setPublicApiFeaturedCoursesService } from '@api/services/v1/courses/course';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';
const OTHER_COURSE_ID = 'course-2';

const course = (overrides: Record<string, unknown> = {}) =>
  ({ id: COURSE_ID, isTemplate: false, isPublished: true, status: 'ACTIVE', ...overrides }) as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
  vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  vi.mocked(getCourseById).mockResolvedValue([course()]);
  vi.mocked(isCourseSlugTaken).mockResolvedValue(false);
  vi.mocked(cloneCourse).mockResolvedValue({ id: OTHER_COURSE_ID } as never);
});

describe('clonePublicApiCourseService', () => {
  it('clones into the key org as the actor', async () => {
    await expect(
      clonePublicApiCourseService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'Copy', slug: 'copy' })
    ).resolves.toEqual({ id: OTHER_COURSE_ID });

    expect(cloneCourse).toHaveBeenCalledWith(COURSE_ID, {
      title: 'Copy',
      description: undefined,
      slug: 'copy',
      userId: ACTOR_ID,
      organizationId: ORG_ID
    });
  });

  it('lets a tutor clone and generates a slug when none is given', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    await clonePublicApiCourseService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'My Copy' });

    const [, options] = vi.mocked(cloneCourse).mock.calls[0];
    expect(options.slug).toMatch(/^my-copy/);
  });

  it('returns 401 without an actor', async () => {
    await expect(
      clonePublicApiCourseService(ORG_ID, null, { courseId: COURSE_ID }, { title: 'Copy' })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(cloneCourse).not.toHaveBeenCalled();
  });

  it('returns 403 for a student', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.STUDENT);

    await expect(
      clonePublicApiCourseService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'Copy' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(cloneCourse).not.toHaveBeenCalled();
  });

  it("returns 404 for another org's course", async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('org-2');

    await expect(
      clonePublicApiCourseService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'Copy' })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(cloneCourse).not.toHaveBeenCalled();
  });

  it('returns 404 for a deleted course', async () => {
    vi.mocked(getCourseById).mockResolvedValue([course({ status: 'DELETED' })]);

    await expect(
      clonePublicApiCourseService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'Copy' })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(cloneCourse).not.toHaveBeenCalled();
  });

  it('returns 403 for a template', async () => {
    vi.mocked(getCourseById).mockResolvedValue([course({ isTemplate: true })]);

    await expect(
      clonePublicApiCourseService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'Copy' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(cloneCourse).not.toHaveBeenCalled();
  });

  it('returns 409 when the slug is taken', async () => {
    vi.mocked(isCourseSlugTaken).mockResolvedValue(true);

    await expect(
      clonePublicApiCourseService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'Copy', slug: 'taken' })
    ).rejects.toMatchObject({ statusCode: 409, code: 'SLUG_IN_USE' });
    expect(cloneCourse).not.toHaveBeenCalled();
  });
});

describe('setPublicApiFeaturedCoursesService', () => {
  it('saves the courses in the given order', async () => {
    const payload = { courseIds: [OTHER_COURSE_ID, COURSE_ID] };

    await expect(setPublicApiFeaturedCoursesService(ORG_ID, ACTOR_ID, payload)).resolves.toEqual(payload);
    expect(reorderOrgCourses).toHaveBeenCalledWith(ORG_ID, [
      { id: OTHER_COURSE_ID, order: 0 },
      { id: COURSE_ID, order: 1 }
    ]);
  });

  it('clears the featured courses with an empty list', async () => {
    await setPublicApiFeaturedCoursesService(ORG_ID, ACTOR_ID, { courseIds: [] });

    expect(reorderOrgCourses).toHaveBeenCalledWith(ORG_ID, []);
  });

  it.each([
    ['a tutor', ROLE.TUTOR],
    ['a student', ROLE.STUDENT]
  ])('returns 403 for %s', async (_label, role) => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(role);

    await expect(
      setPublicApiFeaturedCoursesService(ORG_ID, ACTOR_ID, { courseIds: [COURSE_ID] })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(reorderOrgCourses).not.toHaveBeenCalled();
  });

  it('returns 401 without an actor', async () => {
    await expect(setPublicApiFeaturedCoursesService(ORG_ID, null, { courseIds: [] })).rejects.toMatchObject({
      statusCode: 401
    });
  });

  it("returns 404 for another org's course", async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('org-2');

    await expect(
      setPublicApiFeaturedCoursesService(ORG_ID, ACTOR_ID, { courseIds: [COURSE_ID] })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(reorderOrgCourses).not.toHaveBeenCalled();
  });

  it.each([
    ['unpublished', { isPublished: false }],
    ['deleted', { status: 'DELETED' }],
    ['a template', { isTemplate: true }]
  ])('returns 400 when a course is %s', async (_label, overrides) => {
    vi.mocked(getCourseById).mockResolvedValue([course(overrides)]);

    await expect(
      setPublicApiFeaturedCoursesService(ORG_ID, ACTOR_ID, { courseIds: [COURSE_ID] })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(reorderOrgCourses).not.toHaveBeenCalled();
  });
});
