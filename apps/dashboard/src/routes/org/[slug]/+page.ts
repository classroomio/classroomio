export const load = ({ params = { slug: '' } }) => {
  return {
    orgName: params.slug
  };
};
