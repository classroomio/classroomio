import { browser } from '$app/environment';

export const load = async ({ params = { id: '' } }) => {
  return {
    courseId: params.id
  };
};
