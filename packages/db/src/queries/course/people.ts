import * as schema from '@db/schema';

import { TGroupmember, TNewGroupmember } from '@db/types';
import { and, eq } from 'drizzle-orm';

import { db } from '@db/drizzle';

/**
 * Gets all course members (people) for a course
 * Returns members with their profile information
 * @param courseId Course ID
 * @returns Array of course members with profile data
 */
export async function getCourseMembers(courseId: string): Promise<
  Array<
    TGroupmember & {
      profile: {
        id: string;
        fullname: string | null;
        username: string | null;
        avatarUrl: string | null;
        email: string | null;
      } | null;
    }
  >
> {
  try {
    const result = await db
      .select({
        member: schema.groupmember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        }
      })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(eq(schema.course.id, courseId));

    return result.map((row) => ({
      ...row.member,
      profile: row.profile || null
    }));
  } catch (error) {
    throw new Error(`Failed to get course members: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets a course member by ID
 * @param courseId Course ID
 * @param memberId Member ID
 * @returns Course member with profile data or null if not found
 */
export async function getCourseMember(
  courseId: string,
  memberId: string
): Promise<
  | (TGroupmember & {
      profile: {
        id: string;
        fullname: string | null;
        username: string | null;
        avatarUrl: string | null;
        email: string | null;
      } | null;
    })
  | null
> {
  try {
    const result = await db
      .select({
        member: schema.groupmember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        }
      })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(eq(schema.course.id, courseId), eq(schema.groupmember.id, memberId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      ...result[0].member,
      profile: result[0].profile || null
    };
  } catch (error) {
    throw new Error(`Failed to get course member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the group ID for a course
 * @param courseId Course ID
 * @returns Group ID or null if not found
 */
export async function getCourseGroupId(courseId: string): Promise<string | null> {
  try {
    const result = await db
      .select({ groupId: schema.course.groupId })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    return result.length > 0 ? result[0].groupId : null;
  } catch (error) {
    throw new Error(`Failed to get course group ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Adds a course member (person) to a course
 * @param courseId Course ID
 * @param memberData Member data (profileId, roleId, email)
 * @returns Created member
 */
export async function addCourseMember(
  courseId: string,
  memberData: { profileId?: string; roleId: number; email?: string }
): Promise<TGroupmember> {
  try {
    const groupId = await getCourseGroupId(courseId);
    if (!groupId) {
      throw new Error('Course group not found');
    }

    const [newMember] = await db
      .insert(schema.groupmember)
      .values({
        groupId,
        profileId: memberData.profileId,
        roleId: memberData.roleId,
        email: memberData.email
      })
      .returning();

    if (!newMember) {
      throw new Error('Failed to create course member');
    }

    return newMember;
  } catch (error) {
    throw new Error(`Failed to add course member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates a course member
 * @param courseId Course ID
 * @param memberId Member ID
 * @param data Partial member data to update
 * @returns Updated member
 */
export async function updateCourseMember(
  courseId: string,
  memberId: string,
  data: Partial<TGroupmember>
): Promise<TGroupmember | null> {
  try {
    // Verify member belongs to course
    const member = await getCourseMember(courseId, memberId);
    if (!member) {
      return null;
    }

    const [updated] = await db
      .update(schema.groupmember)
      .set(data)
      .where(eq(schema.groupmember.id, memberId))
      .returning();

    return updated || null;
  } catch (error) {
    throw new Error(`Failed to update course member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes a course member
 * @param courseId Course ID
 * @param memberId Member ID
 * @returns Deleted member or null if not found
 */
export async function deleteCourseMember(courseId: string, memberId: string): Promise<TGroupmember | null> {
  try {
    // Verify member belongs to course
    const member = await getCourseMember(courseId, memberId);
    if (!member) {
      return null;
    }

    const [deleted] = await db.delete(schema.groupmember).where(eq(schema.groupmember.id, memberId)).returning();

    return deleted || null;
  } catch (error) {
    throw new Error(`Failed to delete course member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
