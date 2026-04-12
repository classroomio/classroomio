import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  type TCreateProgram,
  type TUpdateProgram,
  type TAddCourseToProgram,
  type TAddProgramMembers,
  type TUpdateProgramMember,
  type TCreateProgramNewsfeed,
  type TUpdateProgramNewsfeed,
  type TUpdateProgramReaction,
  type TCreateProgramNewsfeedComment
} from '@cio/utils/validation/program';
import {
  addCourseToProgram,
  createProgramWithCreatorMembership,
  createProgramNewsfeed as createProgramNewsfeedQuery,
  createProgramNewsfeedComment as createProgramNewsfeedCommentQuery,
  deleteProgram as deleteProgramQuery,
  deleteProgramNewsfeed as deleteProgramNewsfeedQuery,
  deleteProgramNewsfeedComment as deleteProgramNewsfeedCommentQuery,
  getEnrolledProgramsByProfile,
  getProgramById,
  getProgramMemberByProfileId,
  getProgramMembers,
  getProgramNewsfeed,
  getProgramNewsfeedById,
  getProgramNewsfeedCommentById,
  getProgramNewsfeedComments,
  getProgramsByOrg,
  getCoursesByProgram,
  getProgramMemberRole,
  isProgramCourse,
  isProgramMember,
  removeCourseFromProgram,
  removeProgramMember,
  updateProgram as updateProgramQuery,
  updateProgramMember as updateProgramMemberQuery,
  updateProgramNewsfeed as updateProgramNewsfeedQuery,
  updateProgramNewsfeedReaction
} from '@cio/db/queries/program';
import { getCourseGroupIds } from '@cio/db/queries/course';
import { getProfileByEmail } from '@cio/db/queries/auth';
import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import * as schema from '@db/schema';

type ProgramMemberEnrollment = {
  profileId: string;
  email: string | null;
  roleId: number;
};

async function enrollProgramStudentsInGroups(
  organizationId: string,
  groupIds: string[],
  members: ProgramMemberEnrollment[]
) {
  const studentMembers = members.filter((member) => member.profileId && member.roleId === ROLE.STUDENT);
  const uniqueGroupIds = [...new Set(groupIds)];

  if (studentMembers.length === 0 || uniqueGroupIds.length === 0) {
    return 0;
  }

  const organizationMemberRows = studentMembers.map((member) => ({
    organizationId,
    roleId: ROLE.STUDENT,
    profileId: member.profileId,
    email: member.email?.trim() || undefined,
    verified: true
  }));

  const groupMemberRows = uniqueGroupIds.flatMap((groupId) =>
    studentMembers.map((member) => ({
      groupId,
      roleId: ROLE.STUDENT,
      profileId: member.profileId,
      email: member.email?.trim() || undefined
    }))
  );

  await db.transaction(async (tx) => {
    await tx.insert(schema.organizationmember).values(organizationMemberRows).onConflictDoNothing();
    await tx.insert(schema.groupmember).values(groupMemberRows).onConflictDoNothing();
  });

  return groupMemberRows.length;
}

// ─── Program CRUD ────────────────────────────────────────────────────────────

export async function createProgram(organizationId: string, profileId: string, data: TCreateProgram) {
  try {
    const description = data.description?.trim() || `A program for ${data.name}`;

    return createProgramWithCreatorMembership(
      {
        organizationId,
        createdByProfileId: profileId,
        name: data.name,
        description,
        coverImage: data.coverImage
      },
      profileId
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create program',
      ErrorCodes.PROGRAM_CREATE_FAILED,
      500
    );
  }
}

export async function getProgram(programId: string) {
  try {
    const program = await getProgramById(programId);
    if (!program) {
      throw new AppError('Program not found', ErrorCodes.PROGRAM_NOT_FOUND, 404);
    }
    return program;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get program',
      ErrorCodes.PROGRAM_NOT_FOUND,
      500
    );
  }
}

export async function listOrgPrograms(organizationId: string) {
  try {
    return getProgramsByOrg(organizationId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list programs',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function updateProgram(programId: string, data: TUpdateProgram) {
  try {
    const updated = await updateProgramQuery(programId, data);
    if (!updated) {
      throw new AppError('Program not found', ErrorCodes.PROGRAM_NOT_FOUND, 404);
    }
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update program',
      ErrorCodes.PROGRAM_UPDATE_FAILED,
      500
    );
  }
}

export async function deleteProgram(programId: string) {
  try {
    const deleted = await deleteProgramQuery(programId);
    if (!deleted) {
      throw new AppError('Program not found', ErrorCodes.PROGRAM_NOT_FOUND, 404);
    }
    return deleted;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete program',
      ErrorCodes.PROGRAM_DELETE_FAILED,
      500
    );
  }
}

// ─── Program Members ─────────────────────────────────────────────────────────

export async function listProgramMembers(programId: string) {
  try {
    return getProgramMembers(programId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list program members',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function addProgramMembers(programId: string, data: TAddProgramMembers) {
  try {
    const program = await getProgramById(programId);
    if (!program) {
      throw new AppError('Program not found', ErrorCodes.PROGRAM_NOT_FOUND, 404);
    }

    const programCourses = await getCoursesByProgram(programId);
    const courseGroupIds = (await getCourseGroupIds(programCourses.map((course) => course.course.id))).map(
      (courseGroup) => courseGroup.groupId
    );

    const results = await Promise.allSettled(
      data.members.map(async ({ profileId: providedProfileId, email, roleId }) => {
        const profile = !providedProfileId && email ? await getProfileByEmail(email) : null;
        const profileId = providedProfileId ?? profile?.id ?? null;
        const normalizedEmail = email?.toLowerCase().trim() ?? profile?.email ?? null;

        if (profileId) {
          const existing = await getProgramMemberByProfileId(programId, profileId);
          if (existing) {
            throw new AppError(
              `${email} is already a member of this program`,
              ErrorCodes.MEMBER_ALREADY_IN_PROGRAM,
              409
            );
          }
        }

        if (!profileId && !email) {
          throw new AppError(
            'Either profileId or email must be provided for each member',
            ErrorCodes.VALIDATION_ERROR,
            400
          );
        }

        return db.transaction(async (tx) => {
          const [member] = await tx
            .insert(schema.programMember)
            .values({
              programId,
              profileId,
              roleId,
              email: normalizedEmail ?? undefined
            })
            .returning();

          if (member && member.roleId === ROLE.STUDENT && member.profileId && courseGroupIds.length > 0) {
            const validCourseGroupIds = courseGroupIds.filter((groupId): groupId is string => Boolean(groupId));

            await tx
              .insert(schema.organizationmember)
              .values({
                organizationId: program.organizationId,
                roleId: ROLE.STUDENT,
                profileId: member.profileId,
                email: normalizedEmail ?? undefined,
                verified: true
              })
              .onConflictDoNothing();

            await tx
              .insert(schema.groupmember)
              .values(
                validCourseGroupIds.map((groupId) => ({
                  groupId,
                  roleId: ROLE.STUDENT,
                  profileId: member.profileId,
                  email: normalizedEmail ?? undefined
                }))
              )
              .onConflictDoNothing();
          }

          return member;
        });
      })
    );

    const added = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);
    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

    return { added, errors };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to add program members',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function removeProgramMemberService(_programId: string, memberId: string) {
  try {
    const deleted = await removeProgramMember(memberId);
    if (!deleted) {
      throw new AppError('Program member not found', ErrorCodes.PROGRAM_MEMBER_NOT_FOUND, 404);
    }
    return deleted;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to remove program member',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function updateProgramMemberService(_programId: string, memberId: string, data: TUpdateProgramMember) {
  try {
    const updated = await updateProgramMemberQuery(memberId, { roleId: data.roleId });
    if (!updated) {
      throw new AppError('Program member not found', ErrorCodes.PROGRAM_MEMBER_NOT_FOUND, 404);
    }
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update program member',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function getEnrolledPrograms(profileId: string) {
  try {
    return getEnrolledProgramsByProfile(profileId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get enrolled programs',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

// ─── Program Courses ─────────────────────────────────────────────────────────

export async function listProgramCourses(programId: string, profileId: string) {
  try {
    const roleId = await getProgramMemberRole(programId, profileId);
    const onlyPublished = roleId === ROLE.STUDENT;

    return getCoursesByProgram(programId, onlyPublished);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list program courses',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function addCourseToProgramService(programId: string, data: TAddCourseToProgram) {
  try {
    const program = await getProgramById(programId);
    if (!program) {
      throw new AppError('Program not found', ErrorCodes.PROGRAM_NOT_FOUND, 404);
    }

    const alreadyAdded = await isProgramCourse(programId, data.courseId);
    if (alreadyAdded) {
      throw new AppError('Course is already in this program', ErrorCodes.COURSE_ALREADY_IN_PROGRAM, 409);
    }

    const result = await addCourseToProgram(programId, data.courseId);
    const students = (await getProgramMembers(programId))
      .filter((member) => member.roleId === ROLE.STUDENT && member.profileId)
      .map((member) => ({
        profileId: member.profileId!,
        email: member.email ?? null,
        roleId: member.roleId
      }));

    const courseGroupIds = (await getCourseGroupIds([data.courseId]))
      .map((courseGroup) => courseGroup.groupId)
      .filter((groupId): groupId is string => Boolean(groupId));

    if (students.length > 0 && courseGroupIds.length > 0) {
      await enrollProgramStudentsInGroups(program.organizationId, courseGroupIds, students);
    }

    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to add course to program',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function removeCourseFromProgramService(programId: string, courseId: string) {
  try {
    const deleted = await removeCourseFromProgram(programId, courseId);
    if (!deleted) {
      throw new AppError('Course not found in program', ErrorCodes.NOT_FOUND, 404);
    }
    return deleted;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to remove course from program',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

// ─── Program Newsfeed ────────────────────────────────────────────────────────

export async function listProgramNewsfeed(programId: string, options: { cursor?: string; limit: number }) {
  try {
    return getProgramNewsfeed(programId, options);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list program newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function createProgramNewsfeedService(programId: string, profileId: string, data: TCreateProgramNewsfeed) {
  try {
    const member = await getProgramMemberByProfileId(programId, profileId);
    if (!member) {
      throw new AppError('User is not a member of this program', ErrorCodes.PROGRAM_FORBIDDEN, 403);
    }

    return createProgramNewsfeedQuery({
      programId,
      authorId: member.id,
      content: data.content,
      isPinned: data.isPinned ?? false
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create program newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function updateProgramNewsfeedService(feedId: string, data: TUpdateProgramNewsfeed) {
  try {
    const feed = await getProgramNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Program newsfeed item not found', ErrorCodes.PROGRAM_NEWSFEED_NOT_FOUND, 404);
    }
    return updateProgramNewsfeedQuery(feedId, data);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update program newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function updateProgramNewsfeedReactionService(feedId: string, data: TUpdateProgramReaction) {
  try {
    const feed = await getProgramNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Program newsfeed item not found', ErrorCodes.PROGRAM_NEWSFEED_NOT_FOUND, 404);
    }
    return updateProgramNewsfeedReaction(feedId, data.reaction);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update program newsfeed reaction',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function deleteProgramNewsfeedService(feedId: string) {
  try {
    const feed = await getProgramNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Program newsfeed item not found', ErrorCodes.PROGRAM_NEWSFEED_NOT_FOUND, 404);
    }
    return deleteProgramNewsfeedQuery(feedId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete program newsfeed',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

// ─── Program Newsfeed Comments ────────────────────────────────────────────────

export async function listProgramNewsfeedComments(feedId: string) {
  try {
    const feed = await getProgramNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Program newsfeed item not found', ErrorCodes.PROGRAM_NEWSFEED_NOT_FOUND, 404);
    }
    return getProgramNewsfeedComments(feedId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list program newsfeed comments',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function createProgramNewsfeedCommentService(
  feedId: string,
  profileId: string,
  data: TCreateProgramNewsfeedComment
) {
  try {
    const feed = await getProgramNewsfeedById(feedId);
    if (!feed) {
      throw new AppError('Program newsfeed item not found', ErrorCodes.PROGRAM_NEWSFEED_NOT_FOUND, 404);
    }
    const member = await getProgramMemberByProfileId(feed.programId!, profileId);
    if (!member) {
      throw new AppError('User is not a member of this program', ErrorCodes.PROGRAM_FORBIDDEN, 403);
    }
    return createProgramNewsfeedCommentQuery({
      programNewsfeedId: feedId,
      authorId: member.id,
      content: data.content
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create program newsfeed comment',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function deleteProgramNewsfeedCommentService(commentId: number) {
  try {
    const comment = await getProgramNewsfeedCommentById(commentId);
    if (!comment) {
      throw new AppError('Comment not found', ErrorCodes.PROGRAM_NEWSFEED_COMMENT_NOT_FOUND, 404);
    }
    const feed = await getProgramNewsfeedById(comment.programNewsfeedId!);
    if (!feed) {
      throw new AppError('Program newsfeed item not found', ErrorCodes.PROGRAM_NEWSFEED_NOT_FOUND, 404);
    }
    return deleteProgramNewsfeedCommentQuery(commentId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete program newsfeed comment',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

// ─── Auth Helpers ────────────────────────────────────────────────────────────

async function assertProgramMember(programId: string, profileId: string) {
  const member = await isProgramMember(programId, profileId);
  if (!member) {
    throw new AppError('You are not a member of this program', ErrorCodes.PROGRAM_FORBIDDEN, 403);
  }
}
