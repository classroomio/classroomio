export const load = async ({ parent, data }) => {
  const parentData = await parent();

  return { ...parentData, ...data };
};
