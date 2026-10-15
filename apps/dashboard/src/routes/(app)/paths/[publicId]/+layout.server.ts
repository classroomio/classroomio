export const load = async ({ params }) => {
  return {
    publicId: params.publicId || ''
  };
};
