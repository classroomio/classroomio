export const load = async ({ params = { id: '' } }) => {
  const data = await fetch('/api/analytics/user', {
    method: 'POST',
    body: JSON.stringify({
      userId: params.id
    })
  });

  return {
    profileId: params.id,
    data
  };
};
