export const load = async ({ params }) => {
  const { id: courseId, lessonParams = '' } = params;
  const splitparams = lessonParams.split('/');

  const [lessonId, exerciseRouteName, exerciseId] = splitparams;

  return {
    courseId: courseId || '',
    lessonId,
    exerciseRouteName,
    exerciseId,
    isMaterialsTabActive: !exerciseRouteName
  };
};
