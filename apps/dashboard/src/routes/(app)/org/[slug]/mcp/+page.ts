import { redirect } from '@sveltejs/kit';
export const load = ({ params, url }) => {
  throw redirect(307, `/org/${params.slug}/automation/mcp${url.search}`);
};
