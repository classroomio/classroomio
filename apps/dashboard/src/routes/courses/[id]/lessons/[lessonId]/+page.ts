export const load = async ({ params }) => {
  return {
    courseId: params.id || '',
    lessonId: params.lessonId || ''
  };
};
