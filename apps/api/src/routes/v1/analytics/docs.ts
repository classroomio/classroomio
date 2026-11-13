import { ORG_ANALYTICS_PAGE } from '@cio/utils/constants/analytics-pages';

export const ORG_ANALYTICS_TAG = ORG_ANALYTICS_PAGE.label;
export const MARKETING_TAG = 'Marketing';
export const COMPLIANCE_TAG = 'Compliance';

export const ORG_TEAM_RULE = 'the key creator must be an org admin or tutor';
export const ORG_ADMIN_RULE = 'the key creator must be an org admin';
export const COURSE_TEAM_RULE = 'the key creator must be a course tutor/admin or an org admin';
export const COHORT_TEAM_RULE = 'the key creator must be a cohort tutor/admin or an org admin';
export const ANALYTICS_SCOPE_RULE =
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
  },
  cohortTeam: {
    description: 'Missing the analytics:read scope, or the key creator is not a cohort tutor/admin or org admin'
  },
  scoped: {
    description: `Missing the analytics:read scope, or ${ANALYTICS_SCOPE_RULE}`
  }
};

export const ANALYTICS_SCOPE_NOT_FOUND_RESPONSE = { description: 'Scope not found in this organization' };

export const ANALYTICS_RATE_LIMIT_UNAVAILABLE_RESPONSE = {
  description: 'Redis could not check the analytics rate limit, so the request was refused'
};
