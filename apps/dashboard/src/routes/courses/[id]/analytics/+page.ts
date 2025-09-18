export const load = ({ params }) => {
  const { id } = params;

  return {
    courseId: id
  };
};
