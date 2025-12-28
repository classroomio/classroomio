export const load = async ({ parent }) => {
  const { course, courseId } = await parent();
  return {
    course,
    courseId
  };
};
