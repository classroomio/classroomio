// Course data is loaded in +layout.server.ts
export const load = async ({ parent, params }) => {
  const { course, courseId } = await parent();
  return {
    course,
    courseId,
    personId: params.personId || ''
  };
};
