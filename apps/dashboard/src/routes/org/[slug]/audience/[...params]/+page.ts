export const load = async ({ params }) => {
  const paramParts = params.params?.split('/') ?? [];

  const userId = paramParts[0];
  const orgId = paramParts[1];

  return {
    userId,
    orgId
  };
};
