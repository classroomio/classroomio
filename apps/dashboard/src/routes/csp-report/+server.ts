import type { RequestHandler } from './$types';

/**
 * Accepts browser CSP violation reports (report-only policy `report-uri`).
 * Must stay public — no session — so POST is not redirected to /login.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const raw = await request.text();
    if (raw) {
      JSON.parse(raw);
      // Optional: log parsed report for monitoring (shape varies by directive)
    }
  } catch (error) {
    console.error('csp-report: invalid JSON body', error);
  }

  return new Response(null, { status: 204 });
};
