import {
  and,
  course,
  dashOrgStats,
  db,
  desc,
  eq,
  group,
  groupmember,
  lesson,
  lessonCompletion,
  organization,
  profile,
  sql
} from '@db/drizzle';

export function getCourseStats(orgId: string) {
  const subquery = db
    .select({
      courseId: course.id,
      courseTitle: course.title,
      totalStudents: sql<number>`COUNT(DISTINCT ${groupmember.id})`.as('total_students'),
      totalLessons: sql<number>`COUNT(DISTINCT ${lesson.id})`.as('total_lessons'),
      completedLessons: sql<number>`
        COUNT(DISTINCT ${lessonCompletion.id}) 
        FILTER (WHERE ${lessonCompletion.isComplete} = true)
      `.as('completed_lessons')
    })
    .from(course)
    .innerJoin(group, eq(group.id, course.groupId))
    .leftJoin(groupmember, and(eq(groupmember.groupId, group.id), eq(groupmember.roleId, 3)))
    .leftJoin(lesson, eq(lesson.courseId, course.id))
    .leftJoin(
      lessonCompletion,
      and(eq(lessonCompletion.lessonId, lesson.id), eq(lessonCompletion.profileId, groupmember.profileId))
    )
    .where(and(eq(course.status, 'ACTIVE'), eq(group.organizationId, orgId)))
    .groupBy(course.id, course.title)
    .orderBy(sql`completed_lessons DESC`)
    .as('course_stats');

  return db
    .select({
      courseId: subquery.courseId,
      courseTitle: subquery.courseTitle,
      totalStudents: sql<number>`${subquery.totalStudents}::integer`,
      completionPercentage: sql<number>`
        CASE 
          WHEN ${subquery.totalStudents} * ${subquery.totalLessons} = 0 THEN 0
          ELSE ROUND((${subquery.completedLessons}::numeric / (${subquery.totalStudents} * ${subquery.totalLessons})) * 100)::integer
        END
      `
    })
    .from(subquery)
    .orderBy(subquery.completedLessons)
    .limit(5);
}

export function getRecentEnrollments(orgId: string) {
  return db
    .select({
      profileId: profile.id,
      avatarUrl: profile.avatarUrl,
      fullname: profile.fullname,
      courseId: course.id,
      courseTitle: course.title,
      enrolledAt: groupmember.createdAt
    })
    .from(course)
    .innerJoin(group, eq(group.id, course.groupId))
    .leftJoin(groupmember, and(eq(groupmember.groupId, group.id), eq(groupmember.roleId, 3)))
    .innerJoin(profile, eq(profile.id, groupmember.profileId))
    .where(and(eq(course.status, 'ACTIVE'), eq(group.organizationId, orgId)))
    .groupBy(profile.id, course.id, course.title, groupmember.createdAt)
    .orderBy(desc(groupmember.createdAt))
    .limit(5);
}

export function getDashOrgStats(orgId: string) {
  return db.select().from(dashOrgStats).where(eq(dashOrgStats.orgId, orgId));
}
