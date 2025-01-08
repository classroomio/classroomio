export const load = ({ params = { id: '' } }) => {
  return {
    pathwayId: params.id
  };
};
