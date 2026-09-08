import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';
import { getApiHeaders } from '$lib/utils/services/api';
import { getOrgBySiteName } from '$features/org/api/org.server';
import type { RequestHandler } from './$types';

const ORG_ID_COOKIE_PREFIX = 'cio_org_id_';

/**
 * Streams the roster export from the API to the browser.
 *
 * This proxy exists because the export endpoint is org-scoped through the
 * `cio-org-id` header, and a browser navigation cannot set headers. The body is
 * piped through untouched, so a large export never lands in this process.
 */
export const GET: RequestHandler = async ({ params, cookies, url, fetch }) => {
  const siteName = params.slug;
  // Same cookie the org layout warms, falling back to the lookup it uses.
  // A `+server.ts` handler has no `parent()`, so layout data is not available.
  const cookieKey = `${ORG_ID_COOKIE_PREFIX}${siteName}`;
  let orgId = cookies.get(cookieKey);

  if (!orgId) {
    const org = await getOrgBySiteName(siteName, getApiKeyHeaders());
    orgId = org?.id;
  }

  if (!orgId) {
    error(404, 'Organization not found');
  }

  const apiBase = env.PRIVATE_SERVER_URL;

  if (!apiBase) {
    console.error('audience export: missing PRIVATE_SERVER_URL');
    error(502, 'Export is unavailable');
  }

  // Filters are forwarded verbatim; the API validates them and owns what the
  // scopes mean.
  const upstream = new URL(`${apiBase.replace(/\/$/, '')}/organization/audience/export.csv`);
  upstream.search = url.search;

  const { headers } = getApiHeaders(cookies, orgId);
  const response = await fetch(upstream, { headers });

  if (!response.ok || !response.body) {
    console.error('audience export upstream failed:', response.status);
    error(response.status === 403 ? 403 : 502, 'Export failed');
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'text/csv; charset=utf-8',
      'Content-Disposition': response.headers.get('content-disposition') ?? 'attachment; filename="audience.csv"',
      'Cache-Control': 'no-store'
    }
  });
};
