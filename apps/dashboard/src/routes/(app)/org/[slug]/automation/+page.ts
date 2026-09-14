import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
  throw redirect(307, `/org/${params.slug}/automation/mcp${url.search}`);
};
