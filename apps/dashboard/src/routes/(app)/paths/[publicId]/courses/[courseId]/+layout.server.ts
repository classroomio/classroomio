export const load = async ({ params }) => {
  const courseId = params.courseId || '';
  const publicId = params.publicId || '';
  if (!courseId) {
    return {
      courseId: '',
      publicId
    };
  }

  return {
    courseId,
    publicId
  };
};
