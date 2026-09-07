import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { getApiHeaders } from '$lib/utils/services/api';
import type { RequestHandler } from './$types';

/**
 * Streams the roster export from the API to the browser.
 *
 * This exists rather than linking straight at the API because the export
 * endpoint is org-scoped through the `cio-org-id` header, and a browser
 * navigation cannot set headers. Proxying here keeps the org id out of the URL
 * and still gives the user a real download.
 *
 * The body is piped through untouched, so a 20,000-row export never lands in
 * this process's memory.
 */
export const GET: RequestHandler = async ({ parent, cookies, url, fetch }) => {
  const { orgId } = await parent();

  if (!orgId) {
    error(403, 'Organization not found');
  }

  const apiBase = env.PRIVATE_SERVER_URL;

  if (!apiBase) {
    console.error('audience export: missing PRIVATE_SERVER_URL');
    error(502, 'Export is unavailable');
  }

  // Forward the caller's filters verbatim; the API validates and applies them,
  // and is the only place that decides what the scopes mean.
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
