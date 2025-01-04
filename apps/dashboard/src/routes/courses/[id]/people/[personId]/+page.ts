export const load = async ({ params }) => {
  const { id, personId } = params;

  return {
    userId: personId,
    courseId: id
  };
};
