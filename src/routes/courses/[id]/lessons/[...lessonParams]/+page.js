export const load = ({ params = { id: '' } }) => {
  const { id: courseId, lessonParams = [] } = params;
  console.log(lessonParams, lessonParams);
  // let lessonId = '';
  // let exerciseRouteName = '';
  // let exerciseId = '';
  // if (typeof lessonParams === 'string') {
  //   lessonId
  // }
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
