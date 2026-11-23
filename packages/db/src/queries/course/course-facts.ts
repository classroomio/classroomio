import * as schema from '@db/schema';

import { eq, sql, type SQL } from 'drizzle-orm';

import { db } from '@db/drizzle';

import { ROLE } from '@cio/utils/constants/roles';
import {
  COURSE_DURATION_BUCKET_MAX_MINUTES,
  type TCourseDurationBucket,
  type TCourseLevel
} from '@cio/utils/constants/course-level';

/** Seconds of lesson video in the course, from the uploaded asset when known, else the stored video metadata. */
export function courseVideoSecondsSql(courseId: SQL | typeof schema.course.id): SQL<number> {
  return sql<number>`(
    SELECT COALESCE(SUM(COALESCE(
      fa.duration_seconds,
      CASE WHEN fv.video->'metadata'->>'duration' ~ '^[0-9]+(\\.[0-9]+)?$'
        THEN (fv.video->'metadata'->>'duration')::numeric END
    )), 0)::int
    FROM ${schema.lesson} AS fl
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(fl.videos) = 'array' THEN fl.videos ELSE '[]'::jsonb END
    ) AS fv(video)
    LEFT JOIN ${schema.asset} AS fa ON fa.id::text = fv.video->>'assetId'
    WHERE fl.course_id = ${courseId}
  )`;
}

/** Full name of the course's earliest tutor. */
export function courseTutorNameSql(groupId: SQL | typeof schema.course.groupId): SQL<string | null> {
  return sql<string | null>`(
    SELECT fp.fullname
    FROM ${schema.groupmember} AS fgm
    JOIN ${schema.profile} AS fp ON fp.id = fgm.profile_id
    WHERE fgm.group_id = ${groupId} AND fgm.role_id = ${ROLE.TUTOR}
    ORDER BY fgm.created_at ASC
    LIMIT 1
  )`;
}

function courseDurationMinutesSql(): SQL<number> {
  return sql<number>`COALESCE(
    CASE WHEN ${schema.course.metadata}->>'durationMinutes' ~ '^[0-9]+$'
      THEN (${schema.course.metadata}->>'durationMinutes')::numeric END,
    ${courseVideoSecondsSql(schema.course.id)} / 60.0
  )`;
}

export function courseLevelFilterSql(level: TCourseLevel): SQL<boolean> {
  return sql<boolean>`${schema.course.metadata}->>'level' = ${level}`;
}

/** Courses whose resolved length falls in the bucket; courses with no known length match no bucket. */
export function courseDurationFilterSql(bucket: TCourseDurationBucket): SQL<boolean> {
  const minutes = courseDurationMinutesSql();

  if (bucket === 'short')
    return sql<boolean>`(${minutes} > 0 AND ${minutes} < ${COURSE_DURATION_BUCKET_MAX_MINUTES.short})`;
  if (bucket === 'medium') {
    return sql<boolean>`(${minutes} >= ${COURSE_DURATION_BUCKET_MAX_MINUTES.short} AND ${minutes} <= ${COURSE_DURATION_BUCKET_MAX_MINUTES.medium})`;
  }

  return sql<boolean>`${minutes} > ${COURSE_DURATION_BUCKET_MAX_MINUTES.medium}`;
}

/** Inputs for a single course's learner-facing facts: seconds of lesson video and its earliest tutor's name. */
export async function getCourseFactsSource(
  courseId: string
): Promise<{ videoSeconds: number; tutorName: string | null } | null> {
  try {
    const [row] = await db
      .select({
        videoSeconds: courseVideoSecondsSql(sql`${schema.course}.id`),
        tutorName: courseTutorNameSql(sql`${schema.course}.group_id`)
      })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (!row) return null;

    return { videoSeconds: Number(row.videoSeconds), tutorName: row.tutorName ?? null };
  } catch (error) {
    console.error('getCourseFactsSource error:', error);
    throw new Error('Failed to load course facts');
  }
}
