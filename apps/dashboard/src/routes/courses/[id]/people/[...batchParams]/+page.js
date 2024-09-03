export const load = ({ params = { id: '', batchParams: '' } }) => {
  const { id: courseId, batchParams = '' } = params;
  const splitparams = batchParams.split('/');

  const [batchId] = splitparams;

  return {
    courseId,
    batchId
  };
};
