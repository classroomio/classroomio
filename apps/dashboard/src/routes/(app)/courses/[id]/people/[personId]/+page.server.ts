export const load = async ({ parent }) => {
  const parentData = await parent();

  return {
    courseId: parentData.courseId,
    userId: parentData.personId,
    userCourseAnalytics: parentData.userCourseAnalytics
  };
};
