import { beforeEach, describe, expect, it, vi } from 'vitest';

const { PLATFORM_ORG_ID, mocks } = vi.hoisted(() => ({
  PLATFORM_ORG_ID: 'platform-org',
  mocks: {
    getCourseById: vi.fn(),
    getCourseOrganizationId: vi.fn(),
    listOrgTemplateCards: vi.fn(),
    listGlobalTemplateCards: vi.fn(),
    countOrgTemplates: vi.fn(),
    lockOrganizationForUpdate: vi.fn(),
    getOrganizationMemberRoleId: vi.fn(),
    getActiveOrganizationPlan: vi.fn(),
    cloneCourse: vi.fn()
  }
}));

vi.mock('@db/queries', async () => {
  const access = await vi.importActual<typeof import('@db/queries/course/template-access')>(
    '@db/queries/course/template-access'
  );

  return {
    canUseCourseTemplate: access.canUseCourseTemplate,
    countCourseStudents: vi.fn(),
    countOrgTemplates: mocks.countOrgTemplates,
    getCourseById: mocks.getCourseById,
    getCourseOrganizationId: mocks.getCourseOrganizationId,
    getCourseSectionsByCourseId: vi.fn().mockResolvedValue([]),
    getExercisesByCourseId: vi.fn().mockResolvedValue([]),
    getLessonsByCourseId: vi.fn().mockResolvedValue([]),
    getQuestionsByExerciseIds: vi.fn().mockResolvedValue([]),
    listGlobalTemplateCards: mocks.listGlobalTemplateCards,
    listOrgTemplateCards: mocks.listOrgTemplateCards,
    listTemplateHighlights: vi.fn().mockResolvedValue([]),
    lockOrganizationForUpdate: mocks.lockOrganizationForUpdate,
    updateCourse: vi.fn()
  };
});

vi.mock('@db/drizzle', () => ({
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run({ tx: true })) }
}));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: mocks.getActiveOrganizationPlan,
  getOrganizationMemberRoleId: mocks.getOrganizationMemberRoleId
}));

vi.mock('@cio/core/config/env', () => ({ env: { PLATFORM_TEMPLATES_ORG_ID: PLATFORM_ORG_ID } }));
vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@cio/core/services/course/landing-page', () => ({
  generateUniqueCourseSlug: vi.fn(async (slug: string) => slug)
}));
vi.mock('@cio/core/services/posthog', () => ({ capturePlanLimitReached: vi.fn() }));
vi.mock('@api/services/course/clone', () => ({ cloneCourse: mocks.cloneCourse }));

import { ROLE } from '@cio/utils/constants';
import { PLAN } from '@cio/utils/plans/constants';
import { ErrorCodes } from '@api/utils/errors';
import {
  createCourseFromTemplateService,
  getCourseTemplateService,
  listCourseTemplatesService,
  saveCourseAsTemplateService
} from '@api/services/v1/courses/templates';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const ACTOR_ID = 'actor-1';
const TEMPLATE_ID = '33333333-3333-4333-8333-333333333333';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';

const template = (overrides: Record<string, unknown> = {}) => ({
  id: TEMPLATE_ID,
  title: 'Onboarding',
  description: 'Day one',
  type: 'SELF_PACED',
  bannerImage: null,
  isTemplate: true,
  publicForAll: false,
  status: 'ACTIVE',
  certificate: null,
  metadata: null,
  compliance: null,
  ...overrides
});

const card = (id: string) => ({
  id,
  title: id,
  description: '',
  type: null,
  bannerImage: null,
  createdAt: null,
  lastUsedAt: null
});

const firstPage = { source: 'all' as const, page: 1, limit: 20 };

describe('services/v1/courses/templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrganizationMemberRoleId.mockResolvedValue(ROLE.ADMIN);
    mocks.getCourseById.mockResolvedValue([template()]);
    mocks.getCourseOrganizationId.mockResolvedValue(ORG_ID);
    mocks.listOrgTemplateCards.mockResolvedValue([card('org-a'), card('org-b')]);
    mocks.listGlobalTemplateCards.mockResolvedValue([card('global-a')]);
    mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: PLAN.EARLY_ADOPTER });
    mocks.countOrgTemplates.mockResolvedValue(0);
    mocks.cloneCourse.mockResolvedValue({ id: 'new-course' });
  });

  describe('who may call it', () => {
    const calls = {
      list: (actorId: string | null) => listCourseTemplatesService(ORG_ID, actorId, firstPage),
      get: (actorId: string | null) => getCourseTemplateService(ORG_ID, actorId, { templateId: TEMPLATE_ID }),
      create: (actorId: string | null) =>
        createCourseFromTemplateService(ORG_ID, actorId, { templateId: TEMPLATE_ID }, { title: 'New' }),
      save: (actorId: string | null) =>
        saveCourseAsTemplateService(ORG_ID, actorId, { courseId: COURSE_ID }, { title: 'New' })
    };

    it.each(Object.entries(calls))('%s rejects a key with no actor with 401', async (_name, call) => {
      await expect(call(null)).rejects.toMatchObject({ statusCode: 401 });
    });

    it.each(Object.entries(calls))('%s rejects a student with 403', async (_name, call) => {
      mocks.getOrganizationMemberRoleId.mockResolvedValue(ROLE.STUDENT);

      await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
    });

    it.each([
      ['list', calls.list],
      ['get', calls.get]
    ])('%s lets a tutor in, like the dashboard', async (_name, call) => {
      mocks.getOrganizationMemberRoleId.mockResolvedValue(ROLE.TUTOR);

      await expect(call(ACTOR_ID)).resolves.toBeDefined();
    });

    it.each([
      ['create', calls.create],
      ['save', calls.save]
    ])('%s rejects a tutor with 403, like orgAdminMiddleware', async (_name, call) => {
      mocks.getOrganizationMemberRoleId.mockResolvedValue(ROLE.TUTOR);

      await expect(call(ACTOR_ID)).rejects.toMatchObject({
        statusCode: 403,
        code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
      });
      expect(mocks.cloneCourse).not.toHaveBeenCalled();
    });
  });

  describe('listCourseTemplatesService', () => {
    it('lists org templates first, then global ones, each with its source', async () => {
      const result = await listCourseTemplatesService(ORG_ID, ACTOR_ID, firstPage);

      expect(result.items.map((item) => [item.id, item.source])).toEqual([
        ['org-a', 'org'],
        ['org-b', 'org'],
        ['global-a', 'global']
      ]);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 3, totalPages: 1 });
    });

    it.each([
      ['org', ['org-a', 'org-b']],
      ['global', ['global-a']]
    ] as const)('narrows the list to source=%s', async (source, ids) => {
      const result = await listCourseTemplatesService(ORG_ID, ACTOR_ID, { ...firstPage, source });

      expect(result.items.map((item) => item.id)).toEqual(ids);
      expect(result.pagination.total).toBe(ids.length);
    });

    it('paginates the combined list', async () => {
      const result = await listCourseTemplatesService(ORG_ID, ACTOR_ID, { source: 'all', page: 2, limit: 2 });

      expect(result.items.map((item) => item.id)).toEqual(['global-a']);
      expect(result.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
    });

    it('lists only the org templates that are not also global', async () => {
      mocks.listOrgTemplateCards.mockResolvedValue([card('org-a'), card('global-a')]);

      const result = await listCourseTemplatesService(ORG_ID, ACTOR_ID, firstPage);

      expect(result.items.map((item) => [item.id, item.source])).toEqual([
        ['org-a', 'org'],
        ['global-a', 'global']
      ]);
    });
  });

  describe('getCourseTemplateService', () => {
    it('returns an org template with source org', async () => {
      const result = await getCourseTemplateService(ORG_ID, ACTOR_ID, { templateId: TEMPLATE_ID });

      expect(result).toMatchObject({ id: TEMPLATE_ID, source: 'org', curated: false });
      expect(result).not.toHaveProperty('global');
    });

    it('returns a curated platform template with source global', async () => {
      mocks.getCourseById.mockResolvedValue([template({ publicForAll: true })]);
      mocks.getCourseOrganizationId.mockResolvedValue(PLATFORM_ORG_ID);

      const result = await getCourseTemplateService(ORG_ID, ACTOR_ID, { templateId: TEMPLATE_ID });

      expect(result).toMatchObject({ source: 'global', curated: true });
    });

    it.each([
      ['belongs to another organization', template(), OTHER_ORG_ID],
      ['is a plain course', template({ isTemplate: false }), ORG_ID],
      ['is deleted', template({ status: 'DELETED' }), ORG_ID],
      ['is a private platform template', template({ publicForAll: false }), PLATFORM_ORG_ID]
    ])('is a 404 when the template %s', async (_case, row, orgId) => {
      mocks.getCourseById.mockResolvedValue([row]);
      mocks.getCourseOrganizationId.mockResolvedValue(orgId);

      await expect(getCourseTemplateService(ORG_ID, ACTOR_ID, { templateId: TEMPLATE_ID })).rejects.toMatchObject({
        statusCode: 404
      });
    });
  });

  describe('createCourseFromTemplateService', () => {
    it('clones the template into an unpublished course as the key creator', async () => {
      const result = await createCourseFromTemplateService(
        ORG_ID,
        ACTOR_ID,
        { templateId: TEMPLATE_ID },
        { title: 'Q3 onboarding' }
      );

      expect(result).toEqual({ id: 'new-course' });
      expect(mocks.cloneCourse).toHaveBeenCalledWith(
        TEMPLATE_ID,
        expect.objectContaining({
          title: 'Q3 onboarding',
          userId: ACTOR_ID,
          organizationId: ORG_ID,
          isTemplate: false,
          isPublished: false,
          templateId: TEMPLATE_ID
        })
      );
    });

    it("is a 404 for another organization's template and copies nothing", async () => {
      mocks.getCourseOrganizationId.mockResolvedValue(OTHER_ORG_ID);

      await expect(
        createCourseFromTemplateService(ORG_ID, ACTOR_ID, { templateId: TEMPLATE_ID }, { title: 'New' })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(mocks.cloneCourse).not.toHaveBeenCalled();
    });

    it('does not count against the template limit', async () => {
      mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: PLAN.BASIC });
      mocks.countOrgTemplates.mockResolvedValue(1);

      await expect(
        createCourseFromTemplateService(ORG_ID, ACTOR_ID, { templateId: TEMPLATE_ID }, { title: 'New' })
      ).resolves.toEqual({ id: 'new-course' });
    });
  });

  describe('saveCourseAsTemplateService', () => {
    beforeEach(() => {
      mocks.getCourseById.mockResolvedValue([template({ id: COURSE_ID, isTemplate: false })]);
    });

    it('copies the course into an unpublished template inside the org lock', async () => {
      await saveCourseAsTemplateService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'Onboarding template' });

      expect(mocks.lockOrganizationForUpdate).toHaveBeenCalledWith(ORG_ID, { tx: true });
      expect(mocks.cloneCourse).toHaveBeenCalledWith(
        COURSE_ID,
        expect.objectContaining({
          title: 'Onboarding template',
          userId: ACTOR_ID,
          organizationId: ORG_ID,
          isTemplate: true,
          isPublished: false
        }),
        { tx: true }
      );
    });

    it('is a 403 UPGRADE_REQUIRED once the plan has no template left', async () => {
      mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: PLAN.BASIC });
      mocks.countOrgTemplates.mockResolvedValue(1);

      await expect(
        saveCourseAsTemplateService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'New' })
      ).rejects.toMatchObject({ statusCode: 403, code: ErrorCodes.UPGRADE_REQUIRED });
      expect(mocks.cloneCourse).not.toHaveBeenCalled();
    });

    it.each([
      ['belongs to another organization', template({ id: COURSE_ID, isTemplate: false }), OTHER_ORG_ID],
      ['is deleted', template({ id: COURSE_ID, isTemplate: false, status: 'DELETED' }), ORG_ID]
    ])('is a 404 when the course %s', async (_case, row, orgId) => {
      mocks.getCourseById.mockResolvedValue([row]);
      mocks.getCourseOrganizationId.mockResolvedValue(orgId);

      await expect(
        saveCourseAsTemplateService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'New' })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(mocks.cloneCourse).not.toHaveBeenCalled();
    });
  });
});
