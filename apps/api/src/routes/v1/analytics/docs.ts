export const TAG = 'Analytics';

export const INSIGHTS_TAG = 'Analytics Insights';

export const ORG_TEAM_RULE = 'the key creator must be an org admin or tutor';
export const ORG_ADMIN_RULE = 'the key creator must be an org admin';
export const COURSE_TEAM_RULE = 'the key creator must be a course tutor/admin or an org admin';
export const INSIGHTS_SCOPE_RULE =
  'org scope needs an org admin; cohort/course scopes need their admin or tutor, or an org admin';
export const CACHE_NOTE =
  'each section is cached for up to 10 minutes (login activity: 24 hours), and meta.generatedAt says when the oldest one was computed';
export const LIST_CACHE_NOTE = 'results may be cached for up to 10 minutes';

/** Responses depend on the API key, not just the URL, so no cache (private ones included) may store them. */
export const ANALYTICS_CACHE_CONTROL = 'private, no-store';

export const analyticsForbiddenResponses = {
  orgTeam: {
    description: 'Missing the analytics:read scope, or the key creator is not an org admin or tutor'
  },
  orgAdmin: {
    description: 'Missing the analytics:read scope, or the key creator is not an org admin'
  },
  courseTeam: {
    description: 'Missing the analytics:read scope, or the key creator is not a course tutor/admin or org admin'
  }
};

export const insightsForbiddenResponses = {
  /** The catalog read is an org-team rule; it is stricter than the per-scope reads. */
  catalog: {
    description:
      'The key lacks the public_api:* or analytics:read scope, or the key creator is not an org admin or tutor'
  },
  insights: {
    description: `The key lacks the public_api:* or analytics:read scope, or ${INSIGHTS_SCOPE_RULE}`
  }
};

export const INSIGHTS_SCOPE_NOT_FOUND_RESPONSE = { description: 'Scope not found in this organization' };

export const INSIGHTS_RATE_LIMIT_UNAVAILABLE_RESPONSE = {
  description: 'Redis could not check the insights rate limit, so the request was refused'
};
