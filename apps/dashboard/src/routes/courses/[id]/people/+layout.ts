export const load = ({ params = { id: '', personId: '' } }) => {
  return {
    courseId: params.id,
    personId: params.personId
  };
};
