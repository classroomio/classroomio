export const load = async ({ params }) => {
  const courseId = params.id || '';
  if (!courseId) {
    return {
      courseId: ''
    };
  }

  return {
    courseId
  };
};
