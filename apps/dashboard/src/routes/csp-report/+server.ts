import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const report = await request.json();

    // Log the CSP violation for monitoring
    console.warn('CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      documentURI: report['document-uri'],
      violatedDirective: report['violated-directive'],
      blockedURI: report['blocked-uri'],
      effectiveDirective: report['effective-directive'],
      originalPolicy: report['original-policy'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      userAgent: request.headers.get('user-agent')
    });

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return new Response('Bad Request', { status: 400 });
  }
};
