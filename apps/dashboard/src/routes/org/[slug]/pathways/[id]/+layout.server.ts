export const load = ({ params = { id: '' } }) => {
  return {
    orgName: params.id
  };
};
