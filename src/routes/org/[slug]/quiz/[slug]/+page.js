export const load = ({ params = { slug: '' } }) => {
  return {
    quizId: params.slug,
  };
};
