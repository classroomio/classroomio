export const load = async ({ params, parent }) => {
  const { course, courseId: layoutCourseId } = await parent();
  const { id: courseId, lessonParams = '' } = params;
  const splitparams = lessonParams.split('/');

  const [lessonId, exerciseRouteName, exerciseId] = splitparams;

  return {
    course,
    courseId: courseId || layoutCourseId,
    lessonId,
    exerciseRouteName,
    exerciseId,
    isMaterialsTabActive: !exerciseRouteName
  };
};
