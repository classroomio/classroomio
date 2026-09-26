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
  getCourseMember: vi.fn(),
  getPaginatedCourseMembers: vi.fn()
}));

vi.mock('@cio/core/services/course/course', () => ({
  ensureProgramCourseAccess: vi.fn(),
  updateCourse: vi.fn()
}));

vi.mock('@api/services/course/certificate', () => ({
  assembleCertificateRender: vi.fn()
}));

vi.mock('@api/utils/certificate', async () => {
  const certificates = await import('@cio/certificates');

  return {
    resolveCertificateDesign: certificates.resolveCertificateDesign,
    generateCertificatePdf: vi.fn(),
    generateCertificatePng: vi.fn()
  };
});

import { DEFAULT_CERTIFICATE_DESIGN } from '@cio/certificates';
import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin, isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseById, getCourseByIdForUpdate } from '@cio/db/queries/course/course';
import { getCourseMember, getPaginatedCourseMembers } from '@cio/db/queries/course/people';
import { ensureProgramCourseAccess, updateCourse } from '@cio/core/services/course/course';
import { assembleCertificateRender } from '@api/services/course/certificate';
import { generateCertificatePdf, generateCertificatePng } from '@api/utils/certificate';
import {
  downloadPublicApiCourseCertificateService,
  getPublicApiCourseCertificateService,
  listPublicApiCourseCertificatesService,
  toEffectiveCertificateSettings,
  updatePublicApiCourseCertificateService
} from '@api/services/v1/course-certificate';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const ACTOR_ID = 'actor-1';
const MEMBER_ID = 'member-1';
const params = { courseId: COURSE_ID };
const memberParams = { courseId: COURSE_ID, memberId: MEMBER_ID };
const firstPage = { page: 1, limit: 20 };
const pdfQuery = { format: 'pdf' as const };

const storedDesign = {
  templateId: 'classique' as const,
  accentColor: '#112233',
  subtitle: 'With distinction',
  signatories: [
    { name: 'A', role: 'Dean', enabled: true },
    { name: 'B', role: 'Tutor', enabled: true }
  ] as [{ name: string; role: string; enabled: boolean }, { name: string; role: string; enabled: boolean }],
  idFormat: 'N° {seq}'
};

const storedCertificate = {
  isDownloadable: true,
  theme: 'classique',
  design: storedDesign,
  emailMessage: 'Well done'
};

const storedCourse = {
  id: COURSE_ID,
  status: 'ACTIVE',
  type: 'SELF_PACED',
  compliance: null,
  certificate: storedCertificate
};

const effectiveStored = {
  isDownloadable: true,
  theme: 'classique',
  design: { ...storedDesign, descriptionOverride: undefined },
  deadline: null,
  threshold: 100,
  requiredExerciseId: null,
  exerciseMinScorePercent: null,
  emailMessage: 'Well done'
};

const earnedMember = {
  id: MEMBER_ID,
  roleId: ROLE.STUDENT,
  profileId: 'profile-1',
  certificateEarnedAt: '2026-03-04T05:06:07+00:00',
  profile: { fullname: 'Ada Lovelace' }
};

type TGetCourseByIdResult = Awaited<ReturnType<typeof getCourseById>>;
type TUpdateCourseResult = Awaited<ReturnType<typeof updateCourse>>;
type TListResult = Awaited<ReturnType<typeof getPaginatedCourseMembers>>;
type TMemberResult = Awaited<ReturnType<typeof getCourseMember>>;
type TRenderInput = Awaited<ReturnType<typeof assembleCertificateRender>>;
type TCertificateCourse = Parameters<typeof toEffectiveCertificateSettings>[0];

const emptyPage = { items: [], page: 1, limit: 20, total: 0, totalPages: 0 } as unknown as TListResult;

const mockCourse = (course: Record<string, unknown>) =>
  vi.mocked(getCourseById).mockResolvedValue([course] as unknown as TGetCourseByIdResult);

describe('services/v1/course-certificate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(ensureProgramCourseAccess).mockResolvedValue(false);
    mockCourse(storedCourse);
    vi.mocked(getCourseByIdForUpdate).mockResolvedValue([storedCourse] as unknown as TGetCourseByIdResult);
    vi.mocked(updateCourse).mockImplementation(
      async (_courseId, data) =>
        ({ course: { ...storedCourse, certificate: data.certificate } }) as unknown as TUpdateCourseResult
    );
    vi.mocked(getCourseMember).mockResolvedValue(earnedMember as unknown as TMemberResult);
    vi.mocked(getPaginatedCourseMembers).mockResolvedValue(emptyPage);
    vi.mocked(assembleCertificateRender).mockResolvedValue({
      design: DEFAULT_CERTIFICATE_DESIGN,
      data: { courseName: 'Intro Course' }
    } as unknown as TRenderInput);
    vi.mocked(generateCertificatePdf).mockResolvedValue(Buffer.from('pdf'));
    vi.mocked(generateCertificatePng).mockResolvedValue(Buffer.from('png'));
  });

  const everyCall = [
    ['get', (actorId: string | null) => getPublicApiCourseCertificateService(ORG_ID, actorId, params)],
    [
      'update',
      (actorId: string | null) =>
        updatePublicApiCourseCertificateService(ORG_ID, actorId, params, { isDownloadable: false })
    ],
    ['list', (actorId: string | null) => listPublicApiCourseCertificatesService(ORG_ID, actorId, params, firstPage)],
    [
      'download',
      (actorId: string | null) => downloadPublicApiCourseCertificateService(ORG_ID, actorId, memberParams, pdfQuery)
    ]
  ] as const;

  const teamCalls = everyCall.filter(([name]) => name !== 'get');

  describe('tenant isolation and actor', () => {
    it.each(everyCall)('%s returns 404 for a course in another organization', async (_name, call) => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

      await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 404 });
      expect(getCourseById).not.toHaveBeenCalled();
      expect(updateCourse).not.toHaveBeenCalled();
      expect(getPaginatedCourseMembers).not.toHaveBeenCalled();
      expect(getCourseMember).not.toHaveBeenCalled();
    });

    it.each(everyCall)('%s returns 404 for a course that does not exist', async (_name, call) => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue(null);

      await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 404 });
    });

    it.each(everyCall)('%s returns 401 without an actor', async (_name, call) => {
      await expect(call(null)).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('member vs team authorization', () => {
    it('lets a course member who is not on the team read the settings, like courseMemberMiddleware', async () => {
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(getPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params)).resolves.toEqual(effectiveStored);
    });

    it('lets program access read the settings, like courseMemberMiddleware', async () => {
      vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(false);
      vi.mocked(ensureProgramCourseAccess).mockResolvedValue(true);

      await expect(getPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params)).resolves.toEqual(effectiveStored);
    });

    it('rejects a read from an actor outside the course with 403', async () => {
      vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(getPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params)).rejects.toMatchObject({
        statusCode: 403
      });
      expect(getCourseById).not.toHaveBeenCalled();
    });

    it.each(teamCalls)('%s rejects a course member who is not on the team with 403', async (_name, call) => {
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(updateCourse).not.toHaveBeenCalled();
      expect(getPaginatedCourseMembers).not.toHaveBeenCalled();
      expect(generateCertificatePdf).not.toHaveBeenCalled();
    });
  });

  describe('API-key creator permission changes', () => {
    it.each(teamCalls)(
      '%s re-checks the creator role on every call, so a creator removed from the team loses access',
      async (_name, call) => {
        await expect(call(ACTOR_ID)).resolves.toBeDefined();

        vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

        await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
        expect(isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledTimes(2);
      }
    );

    it('stops reads once the creator leaves the course', async () => {
      await expect(getPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params)).resolves.toBeDefined();

      vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(getPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params)).rejects.toMatchObject({
        statusCode: 403
      });
    });

    it('grants access once the creator is added to the team', async () => {
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      await expect(listPublicApiCourseCertificatesService(ORG_ID, ACTOR_ID, params, firstPage)).rejects.toMatchObject({
        statusCode: 403
      });
      await expect(listPublicApiCourseCertificatesService(ORG_ID, ACTOR_ID, params, firstPage)).resolves.toBeDefined();
    });
  });

  describe('effective settings', () => {
    const course = (certificate: Record<string, unknown> | null, extra: Record<string, unknown> = {}) =>
      ({ type: 'SELF_PACED', compliance: null, certificate, ...extra }) as unknown as TCertificateCourse;

    it('returns the dashboard defaults when nothing is stored', () => {
      expect(toEffectiveCertificateSettings(course(null))).toEqual({
        isDownloadable: false,
        theme: DEFAULT_CERTIFICATE_DESIGN.templateId,
        design: { ...DEFAULT_CERTIFICATE_DESIGN, descriptionOverride: undefined },
        deadline: null,
        threshold: 100,
        requiredExerciseId: null,
        exerciseMinScorePercent: null,
        emailMessage: null
      });
      expect(toEffectiveCertificateSettings(course({}))).toEqual(toEffectiveCertificateSettings(course(null)));
    });

    it('defaults the required exercise score to 100, or the compliance passing score', () => {
      const withExercise = { requiredExerciseId: 'exercise-1' };

      expect(toEffectiveCertificateSettings(course(withExercise)).exerciseMinScorePercent).toBe(100);
      expect(
        toEffectiveCertificateSettings(course(withExercise, { type: 'COMPLIANCE', compliance: { passingScore: 70 } }))
          .exerciseMinScorePercent
      ).toBe(70);
      expect(
        toEffectiveCertificateSettings(course({ ...withExercise, exerciseMinScorePercent: 55 })).exerciseMinScorePercent
      ).toBe(55);
    });

    it('maps a legacy theme-only record to a full design and keeps the stored theme', () => {
      const effective = toEffectiveCertificateSettings(course({ theme: 'noir' }));

      expect(effective.theme).toBe('noir');
      expect(effective.design.templateId).toBe('noir');
      expect(effective.design.signatories).toHaveLength(2);
    });

    it('returns 404 from get for a course that is no longer active', async () => {
      mockCourse({ ...storedCourse, status: 'DELETED' });

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
      expect(result).toEqual({ ...effectiveStored, isDownloadable: false });
    });

    it('clears a nullable field when null is sent', async () => {
      vi.mocked(getCourseByIdForUpdate).mockResolvedValue([
        { ...storedCourse, certificate: { ...storedCertificate, deadline: '2026-12-31T23:59:59Z' } }
      ] as unknown as TGetCourseByIdResult);

      const result = await updatePublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params, { deadline: null });

      expect(updateCourse).toHaveBeenCalledWith(
        COURSE_ID,
        { certificate: { ...storedCertificate, deadline: null } },
        fakeTx
      );
      expect(result.deadline).toBeNull();
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

    it('is idempotent: the same body twice saves the same certificate', async () => {
      let stored: unknown = storedCertificate;
      vi.mocked(getCourseByIdForUpdate).mockImplementation(
        async () => [{ ...storedCourse, certificate: stored }] as unknown as TGetCourseByIdResult
      );
      vi.mocked(updateCourse).mockImplementation(async (_courseId, data) => {
        stored = data.certificate;
        return { course: { ...storedCourse, certificate: data.certificate } } as unknown as TUpdateCourseResult;
      });
      const payload = { threshold: 80, emailMessage: null };

      const first = await updatePublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params, payload);
      const second = await updatePublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params, payload);

      expect(second).toEqual(first);
    });

    it('returns 404 without saving for a course that is no longer active', async () => {
      vi.mocked(getCourseByIdForUpdate).mockResolvedValue([
        { ...storedCourse, status: 'DELETED' }
      ] as unknown as TGetCourseByIdResult);

      await expect(
        updatePublicApiCourseCertificateService(ORG_ID, ACTOR_ID, params, { isDownloadable: false })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(updateCourse).not.toHaveBeenCalled();
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

  describe('download', () => {
    it('renders the student certificate as the student would download it', async () => {
      const result = await downloadPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, memberParams, pdfQuery);

      expect(getCourseMember).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID);
      expect(assembleCertificateRender).toHaveBeenCalledWith(COURSE_ID, {
        studentName: 'Ada Lovelace',
        studentId: 'profile-1',
        issuedAt: '2026-03-04T05:06:07.000Z'
      });
      expect(generateCertificatePng).not.toHaveBeenCalled();
      expect(result).toEqual({ file: Buffer.from('pdf'), format: 'pdf', courseName: 'Intro Course' });
    });

    it('renders a PNG when asked', async () => {
      const result = await downloadPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, memberParams, {
        format: 'png'
      });

      expect(generateCertificatePdf).not.toHaveBeenCalled();
      expect(result.file).toEqual(Buffer.from('png'));
    });

    it('falls back to a generic recipient name like the student download', async () => {
      vi.mocked(getCourseMember).mockResolvedValue({ ...earnedMember, profile: null } as unknown as TMemberResult);

      await downloadPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, memberParams, pdfQuery);

      expect(assembleCertificateRender).toHaveBeenCalledWith(
        COURSE_ID,
        expect.objectContaining({ studentName: 'Recipient' })
      );
    });

    it.each([
      ['a member of another course', null],
      ['a tutor', { ...earnedMember, roleId: ROLE.TUTOR }],
      ['a student who has not earned it', { ...earnedMember, certificateEarnedAt: null }]
    ])('returns 404 for %s', async (_name, member) => {
      vi.mocked(getCourseMember).mockResolvedValue(member as unknown as TMemberResult);

      await expect(
        downloadPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, memberParams, pdfQuery)
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(generateCertificatePdf).not.toHaveBeenCalled();
    });

    it('returns 404 for a course that is no longer active', async () => {
      mockCourse({ ...storedCourse, status: 'DELETED' });

      await expect(
        downloadPublicApiCourseCertificateService(ORG_ID, ACTOR_ID, memberParams, pdfQuery)
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(getCourseMember).not.toHaveBeenCalled();
    });
  });
});
