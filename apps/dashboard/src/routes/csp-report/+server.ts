import type { RequestHandler } from './$types';

const MAX_REPORT_BODY_BYTES = 10_000;

/**
 * Strips query parameters and fragments from URLs in CSP reports to avoid
 * persisting sensitive tokens or excessive payload details in logs.
 *
 * @param rawUrl Potential URL string from CSP report payload
 * @returns Clean origin + pathname string or fallback without query params
 */
function sanitizeReportUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string' || !rawUrl) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return rawUrl.split('?')[0]?.split('#')[0] ?? null;
  }
}

/**
 * Accepts browser CSP violation reports (report-only policy `report-uri`).
 * Must stay public — no session — so POST is not redirected to /login.
 *
 * Limits body size and sanitizes logged fields to avoid log injection or leakage.
 *
 * @param event Request event containing incoming CSP report
 * @returns 204 No Content response
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_REPORT_BODY_BYTES) {
      return new Response(null, { status: 204 });
    }

    const reader = request.body?.getReader();
    if (!reader) {
      return new Response(null, { status: 204 });
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_REPORT_BODY_BYTES) {
        await reader.cancel();
        return new Response(null, { status: 204 });
      }

      chunks.push(value);
    }

    if (totalBytes === 0) {
      return new Response(null, { status: 204 });
    }

    const raw = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf-8');

    const report = JSON.parse(raw);
    const cspData = report['csp-report'] ?? report;

    const sanitized = {
      documentUri: sanitizeReportUrl(cspData['document-uri'] ?? cspData.documentURI),
      blockedUri: sanitizeReportUrl(cspData['blocked-uri'] ?? cspData.blockedURI),
      violatedDirective: cspData['violated-directive'] ?? cspData.violatedDirective,
      effectiveDirective: cspData['effective-directive'] ?? cspData.effectiveDirective,
      disposition: cspData.disposition
    };

    console.warn('[csp-report]', JSON.stringify(sanitized));
  } catch (error) {
    console.error('csp-report: invalid JSON body', error);
  }

  return new Response(null, { status: 204 });
};
