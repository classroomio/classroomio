import * as schema from '@db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@db/drizzle';

export interface LMSExerciseQueryResult {
  id: string;
  title: string;
  updated_at: string;
  questions: {
    points: number;
  }[];
  submission: {
    status_id: number;
    updated_at: string;
    total: number;
    groupmember: {
      id: string;
      profile: {
        id: string;
      }[];
    }[];
  }[];
  lesson: {
    id: string;
    title: string;
    order: number;
    course: {
      id: string;
      title: string;
      group: {
        organisation: {
          id: string;
        }[];
      }[];
      groupmember: {
        id: string;
        profile: {
          id: string;
        }[];
      }[];
    };
  };
}

/**
 * Gets exercises with submissions for a student in an organization
 * Returns exercises from unlocked lessons in courses where the student is a member
 * @param profileId - The profile ID of the student
 * @param orgId - The organization ID
 * @returns Array of exercises with related data
 */
export async function getLMSExercises(profileId: string, orgId: string): Promise<LMSExerciseQueryResult[]> {
  try {
    // Get all courses in the organization where the user is a group member
    const coursesWithMembership = await db
      .select({
        courseId: schema.course.id,
        courseTitle: schema.course.title,
        groupId: schema.group.id,
        lessonId: schema.lesson.id,
        lessonTitle: schema.lesson.title,
        lessonOrder: schema.lesson.order,
        lessonIsUnlocked: schema.lesson.isUnlocked,
        groupMemberId: schema.groupmember.id
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.groupmember, eq(schema.group.id, schema.groupmember.groupId))
      .innerJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId))
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.groupmember.profileId, profileId),
          eq(schema.lesson.isUnlocked, true)
        )
      );

    if (coursesWithMembership.length === 0) {
      return [];
    }

    const lessonIds = [...new Set(coursesWithMembership.map((c) => c.lessonId))];

    // Get exercises for these lessons
    const exercises = await db
      .select({
        id: schema.exercise.id,
        title: schema.exercise.title,
        updatedAt: schema.exercise.updatedAt,
        lessonId: schema.exercise.lessonId
      })
      .from(schema.exercise)
      .where(inArray(schema.exercise.lessonId, lessonIds));

    if (exercises.length === 0) {
      return [];
    }

    const exerciseIds = exercises.map((e) => e.id);

    // Get questions for these exercises
    const questions = await db
      .select({
        exerciseId: schema.question.exerciseId,
        points: schema.question.points
      })
      .from(schema.question)
      .where(inArray(schema.question.exerciseId, exerciseIds));

    // Get groupmember IDs for the user in these courses
    const groupMemberIds = [...new Set(coursesWithMembership.map((c) => c.groupMemberId))];

    // Get submissions for these exercises by this user
    const submissions = await db
      .select({
        id: schema.submission.id,
        exerciseId: schema.submission.exerciseId,
        statusId: schema.submission.statusId,
        total: schema.submission.total,
        updatedAt: schema.submission.updatedAt,
        submittedBy: schema.submission.submittedBy
      })
      .from(schema.submission)
      .where(
        and(inArray(schema.submission.exerciseId, exerciseIds), inArray(schema.submission.submittedBy, groupMemberIds))
      );

    // Build the result structure matching the original interface
    const result: LMSExerciseQueryResult[] = exercises.map((exercise) => {
      const lessonData = coursesWithMembership.find((c) => c.lessonId === exercise.lessonId);
      const exerciseQuestions = questions.filter((q) => q.exerciseId === exercise.id);
      const exerciseSubmissions = submissions.filter((s) => s.exerciseId === exercise.id);

      // Find the groupmember for this course
      const groupMemberId = lessonData?.groupMemberId;

      return {
        id: exercise.id,
        title: exercise.title,
        updated_at: exercise.updatedAt || '',
        questions: exerciseQuestions.map((q) => ({ points: q.points || 0 })),
        submission:
          exerciseSubmissions.length > 0
            ? exerciseSubmissions.map((sub) => ({
                status_id: Number(sub.statusId) || 0,
                updated_at: sub.updatedAt || '',
                total: Number(sub.total) || 0,
                groupmember: groupMemberId
                  ? [
                      {
                        id: groupMemberId,
                        profile: [
                          {
                            id: profileId
                          }
                        ]
                      }
                    ]
                  : []
              }))
            : [],
        lesson: {
          id: lessonData?.lessonId || '',
          title: lessonData?.lessonTitle || '',
          order: Number(lessonData?.lessonOrder) || 0,
          course: {
            id: lessonData?.courseId || '',
            title: lessonData?.courseTitle || '',
            group: [
              {
                organisation: [
                  {
                    id: orgId
                  }
                ]
              }
            ],
            groupmember: groupMemberId
              ? [
                  {
                    id: groupMemberId,
                    profile: [
                      {
                        id: profileId
                      }
                    ]
                  }
                ]
              : []
          }
        }
      };
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to get LMS exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
