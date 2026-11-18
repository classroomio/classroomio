import { error } from '@sveltejs/kit';
import { getZapierPartnerApp } from '@cio/utils/constants/zapier';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const app = getZapierPartnerApp(params.app);

  if (!app) throw error(404, 'Unknown Zapier app');

  return { app };
};
