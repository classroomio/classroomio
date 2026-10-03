/**
 * Row builders for database-backed learner tests. Each writes through the
 * given transaction so a test can roll everything back; see `withRollback`.
 */
import { randomUUID } from 'node:crypto';

import { sql, TransactionRollbackError } from 'drizzle-orm';

import type { DbOrTxClient } from '@cio/db/drizzle';

export const hasDatabase = Boolean(process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL);

export const STUDENT = 3;

/** Runs `test` inside a transaction that is always rolled back. */
export async function withRollback(test: (tx: DbOrTxClient) => Promise<void>) {
  const { db } = await import('@cio/db/drizzle');

  try {
    await db.transaction(async (tx) => {
      await test(tx);
      tx.rollback();
    });
  } catch (error) {
    if (!(error instanceof TransactionRollbackError)) throw error;
  }
}

export async function insertOrganization(tx: DbOrTxClient, name: string) {
  const orgId = randomUUID();
  await tx.execute(sql`INSERT INTO organization (id, name, "siteName") VALUES (${orgId}, ${name}, ${orgId})`);

  return orgId;
}

export async function insertProfile(tx: DbOrTxClient, name: string) {
  const profileId = randomUUID();
  const email = `${name}-${profileId}@learner.test`;
  await tx.execute(sql`INSERT INTO "user" (id, name, email) VALUES (${profileId}, ${name}, ${email})`);
  await tx.execute(
    sql`INSERT INTO profile (id, fullname, username, email) VALUES (${profileId}, ${name}, ${profileId}, ${email})`
  );

  return profileId;
}

export async function insertCourse(
  tx: DbOrTxClient,
  orgId: string,
  title: string,
  options: { lessons: number; type?: string; status?: string; enrollOnlyInLearningPath?: boolean }
) {
  const groupId = randomUUID();
  const courseId = randomUUID();
  const lessonIds = Array.from({ length: options.lessons }, () => randomUUID());

  await tx.execute(sql`INSERT INTO "group" (id, name, organization_id) VALUES (${groupId}, ${title}, ${orgId})`);
  await tx.execute(sql`
    INSERT INTO course (id, title, description, group_id, type, status, enroll_only_in_learning_path)
    VALUES (${courseId}, ${title}, 'x', ${groupId}, ${options.type ?? 'SELF_PACED'}, ${options.status ?? 'ACTIVE'},
      ${options.enrollOnlyInLearningPath ?? false})`);
  for (const [order, lessonId] of lessonIds.entries()) {
    await tx.execute(sql`
      INSERT INTO lesson (id, title, course_id, "order") VALUES (${lessonId}, 'Lesson', ${courseId}, ${order})`);
  }

  return { courseId, groupId, lessonIds };
}

export async function insertMember(tx: DbOrTxClient, groupId: string, profileId: string) {
  const groupMemberId = randomUUID();
  await tx.execute(sql`
    INSERT INTO groupmember (id, group_id, profile_id, role_id) VALUES (${groupMemberId}, ${groupId}, ${profileId}, ${STUDENT})`);

  return groupMemberId;
}

export async function insertGrant(
  tx: DbOrTxClient,
  grant: { groupMemberId: string; courseId: string; profileId: string; source: string; grantedAt: string },
  options: { learningPathId?: string; revokedAt?: string } = {}
) {
  await tx.execute(sql`
    INSERT INTO course_enrollment_grant (groupmember_id, course_id, profile_id, source, learning_path_id, granted_at, revoked_at)
    VALUES (${grant.groupMemberId}, ${grant.courseId}, ${grant.profileId}, ${grant.source},
      ${options.learningPathId ?? null}, ${grant.grantedAt}, ${options.revokedAt ?? null})`);
}

export async function completeLessons(tx: DbOrTxClient, lessonIds: string[], profileId: string, at: string) {
  for (const lessonId of lessonIds) {
    await tx.execute(sql`
      INSERT INTO lesson_completion (lesson_id, profile_id, is_complete, created_at, updated_at)
      VALUES (${lessonId}, ${profileId}, true, ${at}, ${at})`);
  }
}

export async function insertExercise(
  tx: DbOrTxClient,
  courseId: string,
  policy = { name: 'submitted', passThreshold: 0 }
) {
  const exerciseId = randomUUID();
  await tx.execute(sql`
    INSERT INTO exercise (id, title, course_id, completion_policy, pass_threshold, "order")
    VALUES (${exerciseId}, 'Exercise', ${courseId}, ${policy.name}, ${policy.passThreshold || null}, 0)`);

  return exerciseId;
}

export async function submit(
  tx: DbOrTxClient,
  submission: { exerciseId: string; groupMemberId: string; createdAt: string; updatedAt?: string },
  grading: { state: string; total: number } = { state: 'queued', total: 0 }
) {
  await tx.execute(sql`
    INSERT INTO submission (exercise_id, submitted_by, grading_state, total, created_at, updated_at)
    VALUES (${submission.exerciseId}, ${submission.groupMemberId}, ${grading.state}, ${grading.total},
      ${submission.createdAt}, ${submission.updatedAt ?? submission.createdAt})`);
}

export async function insertPath(
  tx: DbOrTxClient,
  orgId: string,
  name: string,
  options: { status?: string; sequentialUnlock?: boolean; certificateDownloadable?: boolean } = {}
) {
  const pathId = randomUUID();
  const publicId = randomUUID().replace(/-/g, '').slice(0, 8);
  const certificate = JSON.stringify({ isDownloadable: options.certificateDownloadable ?? false });
  await tx.execute(sql`
    INSERT INTO learning_path (id, public_id, organization_id, name, slug, description, status, sequential_unlock, certificate)
    VALUES (${pathId}, ${publicId}, ${orgId}, ${name}, ${pathId}, 'x', ${options.status ?? 'ACTIVE'},
      ${options.sequentialUnlock ?? true}, ${certificate}::jsonb)`);

  return { pathId, publicId };
}

export async function addPathCourses(
  tx: DbOrTxClient,
  pathId: string,
  courseIds: string[],
  removedAt: string | null = null
) {
  for (const [order, courseId] of courseIds.entries()) {
    await tx.execute(sql`
      INSERT INTO learning_path_course (learning_path_id, course_id, "order", removed_at)
      VALUES (${pathId}, ${courseId}, ${order}, ${removedAt})`);
  }
}

export async function joinPath(
  tx: DbOrTxClient,
  pathId: string,
  profileId: string,
  enrolledAt: string,
  options: { status?: string; removedAt?: string; roleId?: number } = {}
) {
  const memberId = randomUUID();
  await tx.execute(sql`
    INSERT INTO learning_path_member (id, learning_path_id, profile_id, role_id, enrolled_at, status, removed_at)
    VALUES (${memberId}, ${pathId}, ${profileId}, ${options.roleId ?? STUDENT}, ${enrolledAt}, ${options.status ?? 'NOT_STARTED'},
      ${options.removedAt ?? null})`);

  return memberId;
}

export async function issuePathCertificate(
  tx: DbOrTxClient,
  issue: { pathId: string; memberId: string; profileId: string; issuedAt: string },
  options: { status?: 'valid' | 'revoked'; revokedAt?: string } = {}
) {
  const certificateId = `CERT-${randomUUID().slice(0, 8)}`;
  await tx.execute(sql`
    INSERT INTO learning_path_certificate_issue
      (learning_path_id, learning_path_member_id, profile_id, certificate_id, title, issued_at, status, revoked_at)
    VALUES (${issue.pathId}, ${issue.memberId}, ${issue.profileId}, ${certificateId}, 'Certificate',
      ${issue.issuedAt}, ${options.status ?? 'valid'}, ${options.revokedAt ?? null})`);

  return certificateId;
}
