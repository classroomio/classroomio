import * as z from 'zod';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const timestamp = z.string();
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

export const ZPublicApiAnalyticsOverviewResponse = z.object({
  totalCertificates: z.number(),
  numberOfCourses: z.number(),
  totalStudents: z.number(),
  topCourses: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        enrollments: z.number(),
        completion: z.number().describe('Percentage of enrolled students who completed the course'),
        certification: z.number().describe('Percentage of enrolled students who earned the certificate')
      })
    )
    .describe('Up to 5 courses with the most students'),
  recentCertifications: z
    .array(
      z.object({
        id: z.string().uuid().describe('Profile id of the learner'),
        avatarUrl: z.string().nullable(),
        name: z.string(),
        courseId: z.string().uuid(),
        course: z.string(),
        date: timestamp
      })
    )
    .describe('Up to 5 most recent certificates')
});

export const ZPublicApiAnalyticsTrafficResponse = z.object({
  totals: z.object({
    landingViews: z.number(),
    coursePageViews: z.number(),
    uniqueVisitors: z.number(),
    enrollments: z.number(),
    completions: z.number()
  }),
  sparkline: z
    .array(z.object({ date: z.string().describe('YYYY-MM-DD'), views: z.number(), enrollments: z.number() }))
    .describe('One entry per rolled-up day, oldest first; days with no rollup row are omitted')
});

export const ZPublicApiAnalyticsCountryResponse = z.object({
  country: z.string().describe('ISO 3166-1 alpha-2 code'),
  views: z.number(),
  enrollments: z.number()
});

export const ZPublicApiAnalyticsFunnelResponse = z.object({
  steps: z.array(
    z.object({
      name: z.enum(['landing_view', 'course_page_view', 'enrollment_completed', 'course_completed']),
      count: z.number(),
      conversionFromPrev: z.number().nullable().describe('Ratio (0-1) to the previous step; null for the first step')
    })
  )
});

export const ZPublicApiAnalyticsCourseTypeResponse = z.object({
  type: z.string(),
  enrollments: z.number(),
  views: z.number(),
  completions: z.number(),
  courseCount: z.number()
});

export const ZPublicApiAnalyticsTopCourseResponse = z.object({
  courseId: z.string().uuid(),
  title: z.string(),
  views: z.number()
});

export const ZPublicApiLoginActivityResponse = z.object({
  day: z.enum(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
  count: z.number()
});

export const ZPublicApiComplianceOverviewResponse = z.object({
  summary: z.object({
    totalLearners: z.number(),
    totalCourses: z.number(),
    counts: complianceCounts
  }),
  courses: z.array(
    z.object({
      courseId: z.string().uuid(),
      courseTitle: z.string(),
      learnerCount: z.number(),
      counts: complianceCounts
    })
  )
});

export const ZPublicApiComplianceLearnerResponse = z.object({
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

const ZExerciseStat = z.object({
  id: z.string().uuid(),
  title: z.string(),
  lessonId: z.string().uuid().nullable(),
  lessonTitle: z.string(),
  status: z.number().nullable().describe('Submission status id; null when not submitted'),
  score: z.number(),
  totalPoints: z.number(),
  isCompleted: z.boolean()
});

export const ZPublicApiLearnerAnalyticsResponse = z.object({
  user: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string(),
    avatarUrl: z.string(),
    lastSeen: nullableTimestamp
  }),
  overallCourseProgress: z.number().describe('Percentage of lessons and exercises completed across all courses'),
  overallAverageGrade: z.number().nullable().describe('Average of per-course grades; null when nothing is graded'),
  courses: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      type: z.string().nullable(),
      lessonsCount: z.number(),
      lessonsCompleted: z.number(),
      exercisesCount: z.number(),
      exercisesCompleted: z.number(),
      progressPercentage: z.number(),
      progressFailed: z
        .boolean()
        .describe('True when progress could not be loaded; the course is left out of overall progress'),
      averageGrade: z.number().nullable(),
      certificateEarnedAt: nullableTimestamp,
      complianceStatus: z.string().nullable(),
      exercises: z.array(ZExerciseStat).nullable().describe('null when exercise stats could not be loaded')
    })
  )
});

export const ZPublicApiCourseAnalyticsResponse = z.object({
  totalTutors: z.number(),
  totalStudents: z.number(),
  totalLessons: z.number(),
  totalExercises: z.number(),
  averageProgress: z.number().describe('Average per-student progress (lessons and exercises), as a percentage'),
  averageExerciseCompletion: z.number().describe('Average share of exercises submitted per student, as a percentage'),
  averageGrade: z.number().describe('Average per-student grade, as a percentage')
});

export const ZPublicApiCourseAnalyticsStudentResponse = z.object({
  profileId: z.string().uuid(),
  fullname: z.string(),
  email: z.string(),
  avatarUrl: z.string(),
  lessonsCompleted: z.number(),
  totalLessons: z.number(),
  exercisesSubmitted: z.number(),
  totalExercises: z.number(),
  averageGrade: z.number(),
  progressPercentage: z.number(),
  lastSeen: nullableTimestamp
});
