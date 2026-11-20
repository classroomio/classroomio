import { redirect } from '@sveltejs/kit';

export const load = ({ params }) => {
  redirect(308, `/org/${params.slug}/analytics/compliance`);
};
