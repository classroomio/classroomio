export const load = async ({ parent, params }) => {
  const { course, courseId } = await parent();
  return {
    course,
    courseId,
    userId: params.personId
  };
};
