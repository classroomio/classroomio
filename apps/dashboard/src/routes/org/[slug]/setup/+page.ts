export const load = async ({ params = { slug: '' } }) => {
  return {
    orgSiteName: params.slug
  };
};
