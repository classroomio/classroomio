import { getEnrolledCourses, type TStudentCourse } from '@cio/db/queries/course/course';
import { getUserCourseRole } from '@cio/db/queries/group/group';
import { ROLE } from '@cio/utils/constants';
import { getWebhookCertificateIssue } from '@cio/db/queries/webhook/payload-details';
import { calcCourseProgressPercent } from '@api/utils/course-completion';
import { resolveCertificateDesign } from '@api/utils/certificate';
import { formatCertificateId } from './certificate';
import { orgHasCertificatesEnabled } from './certificate-plan';
import { toEffectiveCertificateSettings } from './certificate-settings';
import { getRenewalWindowDays, getWholeDaysUntil, toIsoTimestamp } from './compliance';

export type LearnerCertificateStatus = 'valid' | 'expiring_soon' | 'expired';

const STATUS_ORDER: LearnerCertificateStatus[] = ['expiring_soon', 'valid', 'expired'];

export type LearnerCertificate = {
  courseId: string;
  courseTitle: string;
  courseImage: string | null;
  courseType: TStudentCourse['type'];
  issuedAt: string;
  certificateId: string;
  expiresAt: string | null;
  cycleNumber: number | null;
  status: LearnerCertificateStatus;
  canDownload: boolean;
};

export type LearnerPendingCertificate = {
  courseId: string;
  courseTitle: string;
  courseImage: string | null;
  progressPercent: number;
};

export type LearnerCertificates = {
  earned: LearnerCertificate[];
  pending: LearnerPendingCertificate[];
};

function toCertificateStatus(
  expiresAt: string | null,
  storedStatus: string | null,
  windowDays: number,
  now: Date
): LearnerCertificateStatus {
  if (!expiresAt) return 'valid';

  const daysUntilExpiry = getWholeDaysUntil(now, new Date(expiresAt));
  if (storedStatus === 'expired' || daysUntilExpiry <= 0) return 'expired';
  if (daysUntilExpiry <= windowDays) return 'expiring_soon';

  return 'valid';
}

function compareCertificates(left: LearnerCertificate, right: LearnerCertificate) {
  const byStatus = STATUS_ORDER.indexOf(left.status) - STATUS_ORDER.indexOf(right.status);
  if (byStatus !== 0) return byStatus;

  return new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime();
}

/**
 * The certificates the learner has earned in the organization, with the printed certificate ID the PDF carries and
 * the expiry of compliance certificates, plus the downloadable certificates of courses they study but have not earned.
 */
export async function listLearnerCertificates(orgId: string, profileId: string): Promise<LearnerCertificates> {
  const now = new Date();
  const [enrolledCourses, certificatesEnabled] = await Promise.all([
    getEnrolledCourses({ orgId, profileId }),
    orgHasCertificatesEnabled(orgId)
  ]);

  const earnedCourses = enrolledCourses.filter((course) => course.certificateEarnedAt);
  const certificateIssues = await Promise.all(
    earnedCourses.map((course) =>
      course.type === 'COMPLIANCE' ? getWebhookCertificateIssue(course.id, profileId) : Promise.resolve(null)
    )
  );

  const earned = earnedCourses
    .map((course, index): LearnerCertificate => {
      const issuedAtDate = new Date(course.certificateEarnedAt!);
      const issuedAt = issuedAtDate.toISOString();
      const design = resolveCertificateDesign(course.certificate);
      const issue = certificateIssues[index] ?? null;
      const expiresAt = toIsoTimestamp(issue?.expiresAt);
      const windowDays = getRenewalWindowDays(course.compliance);
      const isDownloadable = toEffectiveCertificateSettings(course).isDownloadable;
      const certificateId = formatCertificateId(design.idFormat, profileId, issuedAtDate);
      const status = toCertificateStatus(expiresAt, issue?.status ?? null, windowDays, now);

      return {
        courseId: course.id,
        courseTitle: course.title,
        courseImage: course.bannerImage || course.logo || null,
        courseType: course.type,
        issuedAt,
        certificateId,
        expiresAt,
        cycleNumber: issue?.cycleNumber ?? null,
        status,
        canDownload: certificatesEnabled && isDownloadable
      };
    })
    .sort(compareCertificates);

  const pendingCandidates = certificatesEnabled
    ? enrolledCourses.filter(
        (course) => !course.certificateEarnedAt && toEffectiveCertificateSettings(course).isDownloadable
      )
    : [];
  const pendingRoles = await Promise.all(pendingCandidates.map((course) => getUserCourseRole(course.id, profileId)));
  const pending = pendingCandidates
    .filter((_, index) => pendingRoles[index] === ROLE.STUDENT)
    .map((course): LearnerPendingCertificate => {
      const progressPercent = calcCourseProgressPercent({
        lessonsCompleted: course.progressRate,
        totalLessons: course.lessonCount,
        exercisesCompleted: course.exercisesCompleted,
        exercisesCount: course.exerciseCount
      });

      return {
        courseId: course.id,
        courseTitle: course.title,
        courseImage: course.bannerImage || course.logo || null,
        progressPercent
      };
    });

  return { earned, pending };
}
