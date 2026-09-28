import { AppError, ErrorCodes, throwAsInternal } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { containsDisallowedHrefs } from '@cio/utils/validation/shared';
import { db } from '@cio/db/drizzle';
import type {
  TCreateLearningPathInput,
  TPublicLearningPathsQuery,
  TUpdateLearningPath
} from '@cio/utils/validation/learning-path';
import {
  countIssuedCertificates,
  createLearningPath,
  deleteLearningPath,
  enrollMember,
  getLearningPathById,
  getLearningPathByPublicId,
  getLearningPathBySlug,
  getLearningPathCertificateVerification,
  getMemberByPathAndProfile,
  listLearningPathCourses,
  listLearningPaths,
  listPublicLearningPaths,
  revokeLearningPathGrantsForPath,
  updateLearningPath,
  type TLearningPathCourseDetail,
  type TPaginatedLearningPaths
} from '@cio/db/queries/learning-path';
import type { TLearningPath } from '@cio/db/types';
import type { DbOrTxClient } from '@cio/db/drizzle';
import { QUEUE_NAMES, getQueue, getQueueJobEnvelope, type JobEnvelope } from '@cio/jobs';

export interface TLearningPathDetail extends TLearningPath {
  courses: TLearningPathCourseDetail[];
  certificatesIssued: number;
}

/**
 * Resolves a learning path by UUID PK or 8-character publicId.
 */
export async function resolveLearningPath(pathId: string, dbClient?: DbOrTxClient): Promise<TLearningPath> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathId);
  const path = isUuid ? await getLearningPathById(pathId, dbClient) : await getLearningPathByPublicId(pathId, dbClient);

  if (!path) {
    throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
  }

  return path;
}

/**
 * Checks if a tutor is currently assigned as an active tutor in the learning path.
 */
export async function isTutorAssigned(path: TLearningPath, userId: string, dbClient?: DbOrTxClient): Promise<boolean> {
  const member = await getMemberByPathAndProfile(path.id, userId, dbClient);
  return Boolean(member && member.roleId === ROLE.TUTOR && !member.removedAt);
}

/**
 * Asserts that the caller has management access (Admin or assigned Tutor) to a learning path.
 */
export async function assertCanManageLearningPath(
  path: TLearningPath,
  userId: string,
  orgRoles?: Record<string, number>,
  dbClient?: DbOrTxClient
): Promise<void> {
  const roleId = orgRoles?.[path.organizationId];

  if (roleId === ROLE.ADMIN) {
    return;
  }

  if (roleId === ROLE.TUTOR) {
    const canManage = await isTutorAssigned(path, userId, dbClient);
    if (canManage) {
      return;
    }

    throw new AppError(
      'Only assigned tutors or organization admins can manage this learning path',
      ErrorCodes.UNAUTHORIZED,
      403
    );
  }

  throw new AppError('Only organization team members can manage learning paths', ErrorCodes.UNAUTHORIZED, 403);
}

/**
 * Lists learning paths in an organization for team members.
 * Admins see all paths; Tutors see assigned paths or paths they created.
 */
export async function listOrgLearningPaths(
  organizationId: string,
  userId: string,
  orgRoles?: Record<string, number>,
  query?: { page?: number; limit?: number; search?: string }
): Promise<TPaginatedLearningPaths> {
  try {
    const roleId = orgRoles?.[organizationId];
    if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) {
      throw new AppError('Only organization team members can view learning paths', ErrorCodes.UNAUTHORIZED, 403);
    }

    if (roleId === ROLE.ADMIN) {
      return await listLearningPaths(organizationId, {
        page: query?.page,
        limit: query?.limit,
        search: query?.search
      });
    }

    return await listLearningPaths(organizationId, {
      tutorProfileId: userId,
      page: query?.page,
      limit: query?.limit,
      search: query?.search
    });
  } catch (error) {
    throwAsInternal(error, 'Failed to list learning paths');
  }
}

/**
 * Creates a new learning path in UNPUBLISHED status. Only organization admins can create paths.
 */
export async function createLearningPathService(
  organizationId: string,
  userId: string,
  data: TCreateLearningPathInput,
  orgRoles?: Record<string, number>
): Promise<TLearningPath> {
  try {
    const roleId = orgRoles?.[organizationId];
    if (roleId !== ROLE.ADMIN) {
      throw new AppError('Only organization admins can create learning paths', ErrorCodes.UNAUTHORIZED, 403);
    }

    const trimmedName = data.name.trim();
    const trimmedDescription = data.description.trim();

    return await db.transaction(async (tx) => {
      const created = await createLearningPath(
        {
          organizationId,
          createdByProfileId: userId,
          name: trimmedName,
          description: trimmedDescription,
          isPublished: false
        },
        tx
      );

      // Mirror course creation: the creator joins as a tutor so they appear in
      // People and analytics like course creators do in course rosters.
      await enrollMember(
        {
          learningPathId: created.id,
          profileId: userId,
          email: null,
          roleId: ROLE.TUTOR,
          status: 'NOT_STARTED'
        },
        tx
      );

      return created;
    });
  } catch (error) {
    throwAsInternal(error, 'Failed to create learning path');
  }
}

/**
 * Fetches learning path detail including ordered courses.
 */
export async function getLearningPathDetail(
  pathId: string,
  userId: string,
  orgRoles?: Record<string, number>
): Promise<TLearningPathDetail> {
  try {
    return await db.transaction(async (tx) => {
      const path = await resolveLearningPath(pathId, tx);
      const roleId = orgRoles?.[path.organizationId];

      if (roleId === ROLE.ADMIN) {
        // Org admins can always view
      } else if (roleId === ROLE.TUTOR) {
        if (!path.isPublished) {
          const canView = await isTutorAssigned(path, userId, tx);

          if (!canView) {
            throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
          }
        }
      } else if (!path.isPublished) {
        const member = await getMemberByPathAndProfile(path.id, userId, tx);

        if (!member || member.removedAt) {
          throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
        }
      }

      const courses = await listLearningPathCourses(path.id, tx);
      const isTeam = roleId === ROLE.ADMIN || (roleId === ROLE.TUTOR && (await isTutorAssigned(path, userId, tx)));
      const certificatesIssued = isTeam ? await countIssuedCertificates(path.id, tx) : 0;

      return {
        ...path,
        courses,
        certificatesIssued
      };
    });
  } catch (error) {
    throwAsInternal(error, 'Failed to get learning path detail');
  }
}

/**
 * Status of a queued bulk enrollment, scoped to the path's organization so an
 * admin of one org cannot read another org's run by guessing a job id.
 */
export async function getBulkPathEnrollmentStatus(
  pathId: string,
  jobId: string,
  userId: string,
  orgRoles?: Record<string, number>,
  pollCount = 0
): Promise<JobEnvelope> {
  const path = await resolveLearningPath(pathId);
  await assertCanManageLearningPath(path, userId, orgRoles);

  const job = await getQueue(QUEUE_NAMES.audience).getJob(jobId);
  const payloadOrgId = (job?.data as { organizationId?: string } | undefined)?.organizationId;

  if (!job || payloadOrgId !== path.organizationId) {
    throw new AppError('Bulk enrollment not found', ErrorCodes.NOT_FOUND, 404);
  }

  const envelope = await getQueueJobEnvelope(QUEUE_NAMES.audience, jobId, 'path-bulk-enroll', pollCount);

  if (!envelope) {
    throw new AppError('Bulk enrollment not found', ErrorCodes.NOT_FOUND, 404);
  }

  return envelope;
}

/**
 * Updates learning path properties.
 */
export async function updateLearningPathService(
  pathId: string,
  userId: string,
  data: TUpdateLearningPath,
  orgRoles?: Record<string, number>
): Promise<TLearningPath> {
  try {
    return await db.transaction(async (tx) => {
      const path = await resolveLearningPath(pathId, tx);
      await assertCanManageLearningPath(path, userId, orgRoles, tx);

      if (data.landingPage && containsDisallowedHrefs(data.landingPage)) {
        throw new AppError('Landing page contains disallowed links', ErrorCodes.VALIDATION_ERROR, 400);
      }

      if (data.slug && data.slug !== path.slug) {
        const existingWithSlug = await getLearningPathBySlug(path.organizationId, data.slug, tx);

        if (existingWithSlug && existingWithSlug.id !== path.id) {
          throw new AppError('A learning path with this URL slug already exists', ErrorCodes.VALIDATION_ERROR, 400);
        }
      }

      const updated = await updateLearningPath(path.id, data, tx);

      if (!updated) {
        throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
      }

      return updated;
    });
  } catch (error) {
    throwAsInternal(error, 'Failed to update learning path');
  }
}

/**
 * Deletes a learning path.
 * Preserves course rows, group members, and student progress. Revokes the
 * path's LEARNING_PATH grants in the same transaction so no access derived
 * from the deleted container can stay live; learners keeping another live
 * grant (independent, cohort, …) are unaffected.
 */
export async function deleteLearningPathService(
  pathId: string,
  orgRoles?: Record<string, number>
): Promise<TLearningPath> {
  try {
    return await db.transaction(async (tx) => {
      const path = await resolveLearningPath(pathId, tx);
      const roleId = orgRoles?.[path.organizationId];

      if (roleId !== ROLE.ADMIN) {
        throw new AppError('Only organization admins can delete learning paths', ErrorCodes.UNAUTHORIZED, 403);
      }

      const deleted = await deleteLearningPath(path.id, tx);

      if (!deleted) {
        throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
      }

      await revokeLearningPathGrantsForPath(path.id, tx);

      return deleted;
    });
  } catch (error) {
    throwAsInternal(error, 'Failed to delete learning path');
  }
}

/**
 * Lists published learning paths for an organization's public catalog.
 * Unauthenticated-safe projection (see listPublicLearningPaths).
 */
export async function listPublicLearningPathsService(organizationId: string, query: TPublicLearningPathsQuery) {
  try {
    return await listPublicLearningPaths(
      organizationId,
      { page: query.page, limit: query.limit, search: query.search },
      db
    );
  } catch (error) {
    throwAsInternal(error, 'Failed to list public learning paths');
  }
}

/**
 * Loads a public learning path by organizationId and slug for org-site visitors.
 * Only published paths are visible publicly.
 */
export async function getPublicLearningPathBySlug(
  organizationId: string,
  slug: string
): Promise<Omit<TLearningPathDetail, 'welcomeEmailMessage'>> {
  try {
    return await db.transaction(async (tx) => {
      const path = await getLearningPathBySlug(organizationId, slug, tx);

      if (!path || !path.isPublished) {
        throw new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404);
      }

      const courses = await listLearningPathCourses(path.id, tx);
      const certificatesIssued = await countIssuedCertificates(path.id, tx);

      // welcomeEmailMessage is post-enrollment content: never serve it to
      // unauthenticated visitors.
      const { welcomeEmailMessage: _welcomeEmailMessage, ...publicPath } = path;

      return {
        ...publicPath,
        courses,
        certificatesIssued
      };
    });
  } catch (error) {
    throwAsInternal(error, 'Failed to get public learning path');
  }
}

/**
 * Publicly verifies a learning path certificate by its unique public certificateId.
 */
export async function verifyLearningPathCertificateService(
  certificateId: string
): Promise<Awaited<ReturnType<typeof getLearningPathCertificateVerification>>> {
  try {
    const verified = await getLearningPathCertificateVerification(certificateId);

    if (!verified) {
      throw new AppError('Certificate not found', ErrorCodes.LEARNING_PATH_CERTIFICATE_NOT_FOUND, 404);
    }

    return verified;
  } catch (error) {
    throwAsInternal(error, 'Failed to verify learning path certificate');
  }
}
