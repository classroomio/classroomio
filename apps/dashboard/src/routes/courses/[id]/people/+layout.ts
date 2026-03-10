export const load = ({ params }) => {
  return {
    courseId: params.id || '',
    personId: params.personId || ''
  };
};
