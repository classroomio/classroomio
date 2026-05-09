export const load = async ({ params }) => {
  return {
    orgName: params.slug
  };
};
