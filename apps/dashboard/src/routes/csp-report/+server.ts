import type { RequestHandler } from './$types';

/**
 * Accepts browser CSP violation reports (report-only policy `report-uri`).
 * Must stay public — no session — so POST is not redirected to /login.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const raw = await request.text();
    if (raw) {
      const report = JSON.parse(raw);
      console.warn('[csp-report]', JSON.stringify(report));
    }
  } catch (error) {
    console.error('csp-report: invalid JSON body', error);
  }

  return new Response(null, { status: 204 });
};
