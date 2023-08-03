export const load = ({ params = { id: '' } }) => {
  const { id: courseId, lessonParams = [] } = params;
  const splitparams = lessonParams.split('/');
  const [lessonId, exerciseRouteName, exerciseId] = splitparams;

  return {
    courseId,
    lessonId,
    exerciseRouteName,
    exerciseId,
    isMaterialsTabActive: !exerciseRouteName
  };
};
