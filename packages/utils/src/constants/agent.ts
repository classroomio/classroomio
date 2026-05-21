/**
 * Custom request `Content-Type` for `/agent/*` write endpoints.
 *
 * Render fronts every service with Cloudflare, which runs OWASP Managed Rules
 * on bodies whose content-type substring-matches `application/json` and rejects
 * AI chat payloads that contain SQL-injection-shaped strings (e.g. user
 * messages discussing `SELECT … WHERE … OR 1=1`). A vendor-specific type
 * falls through inspection. A small server middleware rewrites it back to
 * `application/json` so `zValidator` parses the body unchanged.
 */
export const AGENT_CONTENT_TYPE = 'application/x-cio-agent';
