/**
 * Custom request `Content-Type` for write endpoints whose bodies contain
 * HTML or AI-generated content.
 *
 * Render fronts every service with Cloudflare, which runs OWASP Managed Rules
 * on bodies whose content-type substring-matches `application/json` and rejects
 * payloads that contain SQL-injection or XSS-shaped strings. A vendor-specific
 * type falls through inspection. A server middleware unwraps the base64
 * envelope and rewrites the content-type back to `application/json` so
 * `zValidator` parses the body unchanged.
 */
export const CIO_ENVELOPE_CONTENT_TYPE = 'application/x-cio-agent';
