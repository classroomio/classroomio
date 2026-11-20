import * as z from 'zod';

import { ZPublicApiGeneratedAtMeta } from './section-query';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const nullableTimestamp = z.string().nullable();

const COMPLIANCE_STATUSES = [
  'compliant',
  'expiring_soon',
  'in_grace_period',
  'non_compliant',
  'waived',
  'in_progress',
  'not_started',
  'no_record'
] as const;

const complianceCounts = z.object(
  Object.fromEntries(COMPLIANCE_STATUSES.map((status) => [status, z.number()])) as Record<
    (typeof COMPLIANCE_STATUSES)[number],
    z.ZodNumber
  >
);

export const ZPublicApiComplianceAnalyticsResponse = z.object({
  summary: z.object({
    totalStudents: z.number(),
    totalCourses: z.number(),
    counts: complianceCounts
  }),
  courses: z.array(
    z.object({
      courseId: z.string().uuid(),
      courseTitle: z.string(),
      studentCount: z.number(),
      counts: complianceCounts
    })
  )
});

export const ZPublicApiComplianceStudentResponse = z.object({
  groupMemberId: z.string().uuid(),
  profileId: z.string().uuid().nullable(),
  fullname: z.string().nullable(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  status: z.enum(COMPLIANCE_STATUSES),
  cycleNumber: z.number().nullable(),
  dueDate: nullableTimestamp,
  completedAt: nullableTimestamp,
  validUntil: nullableTimestamp
});

export const ZPublicApiComplianceAnalyticsMeta = ZPublicApiGeneratedAtMeta;
