import { redirect } from '@sveltejs/kit';

export const load = async ({ params, parent }) => {
  const data = await parent();
  const slug = data.orgSiteName || 'default';
  redirect(307, `/org/${slug}/paths/${params.id}`);
};
