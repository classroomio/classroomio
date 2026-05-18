const LANDING_PAGE_HTML_FORMATTING_RULES =
  'Use <p>, <strong> or <b>, <em> or <i>, lists, and <br> as needed. Do not use heading tags (<h1> through <h6>)—the layout already shows each section title. Use normal paragraph text with bold and italic emphasis only.';

/**
 * Schema / tool-call guidance for HTML landing-page sections (overview, goals, requirements, etc.).
 */
export const LANDING_PAGE_SECTION_HTML_AGENT_HINT = `HTML only. ${LANDING_PAGE_HTML_FORMATTING_RULES}`;

/**
 * Top-level course `description` — the short public course description (not `metadata.description`).
 */
export const LANDING_PAGE_COURSE_DESCRIPTION_PLAIN_HINT =
  'Plain text only, no HTML—the short public course description.';

/**
 * `metadata.description` — the Description block shown after Requirements on the landing page.
 */
export const LANDING_PAGE_METADATA_DESCRIPTION_SECTION_HINT = `HTML for the Description section that appears after Requirements on the landing page (not the top-level course description field). ${LANDING_PAGE_HTML_FORMATTING_RULES}`;
