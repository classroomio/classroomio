export const exploreCoursesQueryKey = (userId: string | null, orgId: string | null) =>
  ['explore', 'courses', userId, orgId] as const;

export const exploreCourseQueryKey = (userId: string | null, orgId: string | null, courseId: string) =>
  ['explore', 'course', userId, orgId, courseId] as const;
