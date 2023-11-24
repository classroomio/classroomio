export const load = ({ params = { id: '' } }) => {
  return {
    courseId: params.id,
  };
};
