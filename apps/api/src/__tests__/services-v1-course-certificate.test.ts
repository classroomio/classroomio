import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fakeTx } = vi.hoisted(() => ({ fakeTx: { tx: true } }));

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(fakeTx)) }
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn(),
  isUserCourseMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseById: vi.fn(),
  getCourseByIdForUpdate: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getPaginatedCourseMembers: vi.fn()
}));

vi.mock('@cio/core/services/course/course', () => ({
  ensureProgramCourseAccess: vi.fn(),
  updateCourse: vi.fn()
}));

import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin, isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseById, getCourseByIdForUpdate } from '@cio/db/queries/course/course';
import { getPaginatedCourseMembers } from '@cio/db/queries/course/people';
import { ensureProgramCourseAccess, updateCourse } from '@cio/core/services/course/course';
import {
  getPublicApiCourseCertificateService,
  listPublicApiCourseCertificatesService,
  updatePublicApiCourseCertificateService
} from '@api/services/v1/course-certificate';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const ACTOR_ID = 'actor-1';
const params = { courseId: COURSE_ID };
const firstPage = { page: 1, limit: 20 };

const storedDesign = {
  templateId: 'classique' as const,
  accentColor: '#112233',
  signatories: [
    { name: 'A', role: 'Dean', enabled: true },
    { name: 'B', role: 'Tutor', enabled: true }
  ] as [{ name: string; role: string; enabled: boolean }, { name: string; role: string; enabled: boolean }]
};

const storedCertificate = {
  isDownloadable: true,
  theme: 'classique',
  design: storedDesign,
  emailMessage: 'Well done'
};

const storedCourse = [{ id: COURSE_ID, status: 'ACTIVE', certificate: storedCertificate }];

type TGetCourseByIdResult = Awaited<ReturnType<typeof getCourseById>>;
type TUpdateCourseResult = Awaited<ReturnType<typeof updateCourse>>;
type TListResult = Awaited<ReturnType<typeof getPaginatedCourseMembers>>;

describe('services/v1/course-certificate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(ensureProgramCourseAccess).mockResolvedValue(false);
    vi.mocked(getCourseById).mockResolvedValue(storedCourse as unknown as TGetCourseByIdResult);
    vi.mocked(getCourseByIdForUpdate).mockResolvedValue(storedCourse as unknown as TGetCourseByIdResult);
    vi.mocked(updateCourse).mockImplementation(
      async (_courseId, data) => ({ course: { certificate: data.certificate } }) as unknown as TUpdateCourseResult
    );
  });

  describe('tenant isolation and actor', () => {
    it.each([
      ['get', () => getPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params)],
      ['update', () => updatePublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params, { isDownloadable: false })],
      ['list', () => listPublicApiCourseCertificatesService(ORG_ID, ACTOR_ID, params, firstPage)]
    ])('%s returns 404 for a course in another organization', async (_name, call) => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

      await expect(call()).rejects.toMatchObject({ statusCode: 404 });
      expect(getCourseById).not.toHaveBeenCalled();
      expect(updateCourse).not.toHaveBeenCalled();
      expect(getPaginatedCourseMembers).not.toHaveBeenCalled();
    });

    it.each([
      ['get', () => getPublicApiCourseCertificateService(ORG_ID, null, params)],
      ['update', () => updatePublicApiCourseCertificateService(ORG_ID, null, params, { isDownloadable: false })],
      ['list', () => listPublicApiCourseCertificatesService(ORG_ID, null, params, firstPage)]
    ])('%s returns 401 without an actor', async (_name, call) => {
      await expect(call()).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('dashboard parity', () => {
    it('lets a course member who is not on the team read the settings, like courseMemberMiddleware', async () => {
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(getPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params)).resolves.toEqual(storedCertificate);
      expect(getCourseById).toHaveBeenCalledWith(COURSE_ID);
    });

    it('lets program access read the settings, like courseMemberMiddleware', async () => {
      vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(false);
      vi.mocked(ensureProgramCourseAccess).mockResolvedValue(true);

      await expect(getPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params)).resolves.toEqual(storedCertificate);
    });

    it('rejects a read from an actor outside the course with 403', async () => {
      vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(getPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params)).rejects.toMatchObject({
        statusCode: 403
      });
      expect(getCourseById).not.toHaveBeenCalled();
    });

    it('rejects updates and the issued list from a non-team actor with 403, like courseTeamMemberMiddleware', async () => {
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(
        updatePublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params, { isDownloadable: false })
      ).rejects.toMatchObject({ statusCode: 403 });
      await expect(listPublicApiCourseCertificatesService(ORG_ID, ACTOR_ID, params, firstPage)).rejects.toMatchObject({
        statusCode: 403
      });
      expect(updateCourse).not.toHaveBeenCalled();
      expect(getPaginatedCourseMembers).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('returns 404 for a course that is no longer active', async () => {
      vi.mocked(getCourseById).mockResolvedValue([
        { ...storedCourse[0], status: 'DELETED' }
      ] as unknown as TGetCourseByIdResult);

      await expect(getPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params)).rejects.toMatchObject({
        statusCode: 404
      });
    });
  });

  describe('update', () => {
    it('locks the course row and saves through the dashboard updateCourse in the same transaction', async () => {
      const result = await updatePublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params, { isDownloadable: false });

      expect(db.transaction).toHaveBeenCalledTimes(1);
      expect(getCourseByIdForUpdate).toHaveBeenCalledWith(COURSE_ID, fakeTx);
      expect(updateCourse).toHaveBeenCalledWith(
        COURSE_ID,
        { certificate: { ...storedCertificate, isDownloadable: false } },
        fakeTx
      );
      expect(result).toEqual({ ...storedCertificate, isDownloadable: false });
    });

    it('replaces the design and sets theme to the new templateId, like the dashboard editor', async () => {
      const design = { ...storedDesign, templateId: 'noir' as const };

      await updatePublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params, { design });

      expect(updateCourse).toHaveBeenCalledWith(
        COURSE_ID,
        { certificate: { ...storedCertificate, design, theme: 'noir' } },
        fakeTx
      );
    });

    it('keeps an explicit theme when one is sent', async () => {
      const design = { ...storedDesign, templateId: 'noir' as const };

      await updatePublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params, { design, theme: 'professional' });

      expect(updateCourse).toHaveBeenCalledWith(
        COURSE_ID,
        { certificate: { ...storedCertificate, design, theme: 'professional' } },
        fakeTx
      );
    });

    it('returns 404 when the course row is gone', async () => {
      vi.mocked(getCourseByIdForUpdate).mockResolvedValue([] as unknown as TGetCourseByIdResult);

      await expect(
        updatePublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params, { isDownloadable: false })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(updateCourse).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('queries the members page for students with an earned certificate and maps it', async () => {
      vi.mocked(getPaginatedCourseMembers).mockResolvedValue({
        items: [
          {
            id: 'member-1',
            profileId: 'profile-1',
            email: null,
            certificateEarnedAt: '2026-01-01T00:00:00Z',
            certificationEmailSentAt: null,
            profile: { fullname: 'Ada', email: 'ada@example.com' }
          }
        ],
        page: 2,
        limit: 10,
        total: 11,
        totalPages: 2
      } as unknown as TListResult);

      const result = await listPublicApiCourseCertificatesService(ORG_ID, ACTOR_ID, params, {
        page: 2,
        limit: 10,
        search: 'ada'
      });

      expect(getPaginatedCourseMembers).toHaveBeenCalledWith(COURSE_ID, {
        page: 2,
        limit: 10,
        search: 'ada',
        roleId: ROLE.STUDENT,
        certificateEarned: true
      });
      expect(result).toEqual({
        items: [
          {
            memberId: 'member-1',
            profileId: 'profile-1',
            fullname: 'Ada',
            email: 'ada@example.com',
            certificateEarnedAt: '2026-01-01T00:00:00Z',
            certificationEmailSentAt: null
          }
        ],
        pagination: { page: 2, limit: 10, total: 11, totalPages: 2 }
      });
    });
  });
});
