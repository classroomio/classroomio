import { createHash, randomBytes } from 'node:crypto';

import { buildEmailBranding, resolveThemeColor } from '@cio/email';
import { enqueueEmailSend } from '@cio/jobs';
import { getAppBaseUrl } from '@cio/core/config/dashboard-url';
import { getOrganizationById } from '@cio/db/queries/organization';
import { getCourseById } from '@cio/db/queries/course';
import { getCourseStudentMemberIds } from '@cio/db/queries/exercise';
import {
  getStudentExerciseScores,
  getStudentReportByTokenHash,
  insertStudentReport,
  listStudentReports,
  recordStudentReportView,
  revokeStudentReport
} from '@cio/db/queries/student-report';
import { getProfileById } from '@cio/db/queries/auth';
import type { TStudentReportCreate } from '@cio/utils/validation/student-report';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { getStudentSkillMastery } from '@api/services/skill/mastery';

const DAY_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function formatPeriod(periodStart: string, periodEnd: string): string {
  const format = (value: string) => new Date(value).toISOString().slice(0, 10);

  return `${format(periodStart)} to ${format(periodEnd)}`;
}

/**
 * Creates one share link per student. Each link carries a random 256-bit token that is shown only in this response:
 * only its SHA-256 hash is stored, so a database read cannot reveal a working link.
 */
export async function createStudentReportsService(
  courseId: string,
  orgId: string,
  createdBy: string,
  input: TStudentReportCreate
) {
  const profileIds = [...new Set(input.profileIds)];
  const memberIdByProfile = await getCourseStudentMemberIds(courseId, profileIds);
  if (memberIdByProfile.size !== profileIds.length) {
    throw new AppError('Reports can only be made for students of this course', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const expiresAt = new Date(Date.now() + input.expiresInDays * DAY_MS).toISOString();
  const reports = [];

  for (const profileId of profileIds) {
    const token = randomBytes(32).toString('base64url');
    const row = await insertStudentReport({
      tokenHash: hashToken(token),
      organizationId: orgId,
      courseId,
      profileId,
      createdBy,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      teacherComment: input.teacherComment || null,
      parentEmail: input.parentEmail ?? null,
      expiresAt
    });

    reports.push({ reportId: row.id, profileId, url: `${getAppBaseUrl()}/report/${token}`, expiresAt });
  }

  if (input.sendToParent && input.parentEmail) {
    await sendReportToParent(courseId, orgId, profileIds[0], input, reports[0].url);
  }

  return { reports };
}

async function sendReportToParent(
  courseId: string,
  orgId: string,
  profileId: string,
  input: TStudentReportCreate,
  reportUrl: string
) {
  const [organization, profile, courseRows] = await Promise.all([
    getOrganizationById(orgId),
    getProfileById(profileId),
    getCourseById(courseId)
  ]);
  if (!organization || !profile || !courseRows[0]) return;

  await enqueueEmailSend({
    kind: 'template',
    template: 'studentReport',
    to: input.parentEmail!,
    fields: {
      orgName: organization.name,
      studentName: profile.fullname,
      courseName: courseRows[0].title,
      periodLabel: formatPeriod(input.periodStart, input.periodEnd),
      reportUrl,
      branding: buildEmailBranding(organization)
    },
    organizationId: orgId
  });
}

export async function listStudentReportsService(courseId: string, profileId: string) {
  return listStudentReports(courseId, profileId);
}

export async function revokeStudentReportService(courseId: string, reportId: string) {
  const revoked = await revokeStudentReport(courseId, reportId);
  if (!revoked) throw new AppError('Report not found', ErrorCodes.STUDENT_REPORT_NOT_FOUND, 404);

  return revoked;
}

/**
 * The page data behind a share token. A wrong, expired and revoked token all answer with the same 404 so the
 * response never tells a guesser which links exist. Only first name-level identity is returned: no email, no ids.
 */
export async function getPublicStudentReport(token: string) {
  const report = await getStudentReportByTokenHash(hashToken(token));
  const isUsable = report && !report.revokedAt && new Date(report.expiresAt).getTime() > Date.now();
  if (!report || !isUsable) throw new AppError('Report not found', ErrorCodes.STUDENT_REPORT_NOT_FOUND, 404);

  const [mastery, scores] = await Promise.all([
    getStudentSkillMastery(report.courseId, report.profileId),
    getStudentExerciseScores(report.courseId, report.profileId, report.periodStart, report.periodEnd)
  ]);
  void recordStudentReportView(report.id);

  const skills = mastery.filter((skill) => skill.level !== 'not_started');
  const toSkill = (skill: (typeof skills)[number]) => ({
    code: skill.code,
    name: skill.name,
    level: skill.level,
    score: skill.score === null ? null : Math.round(skill.score)
  });

  return {
    organization: {
      name: report.orgName,
      logoUrl: report.orgLogoUrl,
      themeColor: resolveThemeColor(report.orgTheme) ?? null
    },
    studentName: report.studentName,
    courseTitle: report.courseTitle,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    expiresAt: report.expiresAt,
    teacherComment: report.teacherComment,
    masteredSkills: skills.filter((skill) => skill.level === 'mastered' || skill.level === 'proficient').map(toSkill),
    skillsToWorkOn: skills.filter((skill) => skill.level === 'learning').map(toSkill),
    scores: scores.map((score) => ({
      exerciseTitle: score.title,
      score: score.score,
      maxScore: score.maxScore,
      percent: score.maxScore > 0 ? Math.round((score.score / score.maxScore) * 100) : null,
      submittedAt: score.submittedAt
    }))
  };
}
