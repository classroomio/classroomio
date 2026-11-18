import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  getCourseById: vi.fn(),
  getReadiness: vi.fn(),
  publishWhenReady: vi.fn(),
  resolveBanner: vi.fn(),
  buildLinks: vi.fn(),
  assertOrgTeamMember: vi.fn(),
  assertCourseTeamAccess: vi.fn(),
  emitWebhook: vi.fn()
}));

vi.mock('@cio/core/services/course/course', () => ({
  createCourse: mocks.createCourse,
  updateCourse: mocks.updateCourse,
  deleteCourse: vi.fn(),
  getCourse: vi.fn()
}));
vi.mock('@cio/db/queries/course', () => ({ getCourseById: mocks.getCourseById, isCourseSlugTaken: vi.fn() }));
vi.mock('@cio/core/services/course/go-live-readiness', () => ({
  getCourseGoLiveReadiness: mocks.getReadiness,
  publishCourseWhenReady: mocks.publishWhenReady
}));
vi.mock('@cio/core/services/course/landing-page', () => ({
  resolveCourseBanner: mocks.resolveBanner,
  buildCourseLinks: mocks.buildLinks
}));
vi.mock('@cio/core/services/webhook/emit', () => ({ emitCoursePublishWebhookEvent: mocks.emitWebhook }));
vi.mock('@api/services/v1/shared', () => ({
  assertAutomationActor: vi.fn(),
  assertOrgTeamMember: mocks.assertOrgTeamMember,
  assertCourseBelongsToOrganization: vi.fn(),
  assertCourseTeamAccess: mocks.assertCourseTeamAccess,
  assertProfileBelongsToOrganization: vi.fn()
}));
vi.mock('@api/services/course-import/course-import', () => ({
  createCourseImportDraftService: vi.fn(),
  getCourseImportStructureService: vi.fn(),
  publishCourseImportDraftToExistingCourseService: vi.fn()
}));
vi.mock('@api/services/organization', () => ({ getOrganizationCourses: vi.fn() }));
vi.mock('@api/services/course/clone', () => ({ cloneCourse: vi.fn() }));
vi.mock('@api/services/course/people', () => ({ listPaginatedCourseMembers: vi.fn() }));
vi.mock('@api/services/course/certificate-plan', () => ({ assertCertificateChangeAllowed: vi.fn() }));
vi.mock('@api/services/course/update-course', () => ({ updateCourseWithTags: vi.fn() }));
vi.mock('@cio/db/queries/tag', () => ({
  getCourseTagsByCourseIdsForOrganization: vi.fn(),
  getCourseTagsForOrganization: vi.fn(),
  getRelatedCourses: vi.fn()
}));

import {
  createPublicApiCourseService,
  publishPublicApiCourseService,
  unpublishPublicApiCourseService
} from '@api/services/v1/courses/course';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const LINKS = { appUrl: `https://app.example.com/courses/${COURSE_ID}`, landingPageUrl: null };
const unpublishedCourse = { id: COURSE_ID, title: 'Safety', isPublished: false, bannerImage: null };

describe('course create, publish and unpublish services', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.buildLinks.mockResolvedValue(LINKS);
    mocks.assertOrgTeamMember.mockResolvedValue(1);
  });

  it('creates an unpublished course, applies the banner and returns both links', async () => {
    mocks.createCourse.mockResolvedValue({ course: unpublishedCourse, groupId: 'g', memberId: 'm' });
    mocks.resolveBanner.mockResolvedValue({
      applied: true,
      imageUrl: 'https://images.unsplash.com/photo-1',
      source: 'unsplash',
      reason: null
    });
    mocks.createCourse.mockResolvedValue({
      course: { ...unpublishedCourse, bannerImage: 'https://images.unsplash.com/photo-1' },
      groupId: 'g',
      memberId: 'm'
    });

    const result = await createPublicApiCourseService('org-1', 'actor-1', {
      title: 'Safety',
      description: 'About safety',
      type: 'SELF_PACED',
      generateBannerImage: true
    });

    expect(mocks.assertOrgTeamMember).toHaveBeenCalledWith('org-1', 'actor-1');
    expect(mocks.createCourse.mock.calls[0]![1]).not.toHaveProperty('generateBannerImage');
    expect(mocks.createCourse.mock.calls[0]![1]).toMatchObject({ organizationId: 'org-1', title: 'Safety' });
    expect(mocks.createCourse.mock.calls[0]![1]).toMatchObject({ bannerImage: 'https://images.unsplash.com/photo-1' });
    expect(mocks.resolveBanner.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.createCourse.mock.invocationCallOrder[0]!
    );
    expect(mocks.updateCourse).not.toHaveBeenCalled();
    expect(result.course.isPublished).toBe(false);
    expect(result.banner).toMatchObject({ applied: true, source: 'unsplash' });
    expect(result).toMatchObject(LINKS);
  });

  it('reports why no banner was applied without failing the create', async () => {
    mocks.createCourse.mockResolvedValue({ course: unpublishedCourse, groupId: 'g', memberId: 'm' });
    mocks.resolveBanner.mockResolvedValue({
      applied: false,
      imageUrl: null,
      source: null,
      reason: 'unsplash_not_configured'
    });

    const result = await createPublicApiCourseService('org-1', 'actor-1', {
      title: 'Safety',
      description: 'About safety',
      type: 'SELF_PACED'
    });

    expect(mocks.updateCourse).not.toHaveBeenCalled();
    expect(result.banner.reason).toBe('unsplash_not_configured');
  });

  it('refuses to create when the actor is not an org admin or tutor', async () => {
    mocks.assertOrgTeamMember.mockRejectedValue(new Error('forbidden'));

    await expect(
      createPublicApiCourseService('org-1', 'actor-1', { title: 'T', description: 'D', type: 'SELF_PACED' })
    ).rejects.toThrow('forbidden');
    expect(mocks.createCourse).not.toHaveBeenCalled();
  });

  it('returns blockers and leaves the course unpublished when it is not ready', async () => {
    const blockers = [{ code: 'LANDING_IMAGE_MISSING', message: 'Add a banner' }];
    mocks.getReadiness.mockResolvedValue({ ready: false, blockers, warnings: [] });
    mocks.getCourseById.mockResolvedValue([unpublishedCourse]);

    const result = await publishPublicApiCourseService('org-1', 'actor-1', { courseId: COURSE_ID });

    expect(mocks.publishWhenReady).not.toHaveBeenCalled();
    expect(result).toMatchObject({ published: false, blockers, landingPageUrl: null });
  });

  it('publishes a ready course and returns the landing page link', async () => {
    const published = { ...unpublishedCourse, isPublished: true, slug: 'safety' };
    const landing = { appUrl: LINKS.appUrl, landingPageUrl: 'https://org.example.com/course/safety' };
    mocks.getReadiness.mockResolvedValue({ ready: true, blockers: [], warnings: [] });
    mocks.publishWhenReady.mockResolvedValue({
      course: published,
      readiness: { ready: true, blockers: [], warnings: [] }
    });
    mocks.buildLinks.mockResolvedValue(landing);

    const result = await publishPublicApiCourseService('org-1', 'actor-1', { courseId: COURSE_ID });

    expect(mocks.publishWhenReady).toHaveBeenCalledWith(COURSE_ID, 'actor-1');
    expect(result).toMatchObject({ published: true, ...landing });
  });

  it('refuses to publish or unpublish for an actor outside the course team', async () => {
    mocks.assertCourseTeamAccess.mockRejectedValue(new Error('forbidden'));

    await expect(publishPublicApiCourseService('org-1', 'member-1', { courseId: COURSE_ID })).rejects.toThrow(
      'forbidden'
    );
    await expect(unpublishPublicApiCourseService('org-1', 'member-1', { courseId: COURSE_ID })).rejects.toThrow(
      'forbidden'
    );
    expect(mocks.assertCourseTeamAccess).toHaveBeenCalledWith('org-1', 'member-1', COURSE_ID);
    expect(mocks.getReadiness).not.toHaveBeenCalled();
    expect(mocks.updateCourse).not.toHaveBeenCalled();
  });

  it('unpublishes a course and emits the publish webhook change', async () => {
    mocks.updateCourse.mockResolvedValue({ course: unpublishedCourse, publishChange: 'unpublished' });

    const result = await unpublishPublicApiCourseService('org-1', 'actor-1', { courseId: COURSE_ID });

    expect(mocks.updateCourse).toHaveBeenCalledWith(COURSE_ID, { isPublished: false });
    expect(mocks.emitWebhook).toHaveBeenCalledWith(COURSE_ID, 'unpublished', 'actor-1');
    expect(result).toMatchObject(LINKS);
  });
});
