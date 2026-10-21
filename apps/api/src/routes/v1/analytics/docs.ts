export const TAG = 'Analytics';

export const ORG_TEAM_RULE = 'the key creator must be an org admin or tutor';
export const ORG_ADMIN_RULE = 'the key creator must be an org admin';
export const COURSE_TEAM_RULE = 'the key creator must be a course tutor/admin or an org admin';
export const CACHE_NOTE =
  'each section is cached for up to 10 minutes (login activity: 24 hours), and meta.generatedAt says when the oldest one was computed';
export const LIST_CACHE_NOTE = 'results may be cached for up to 10 minutes';

/** Responses depend on the API key, not just the URL, so no cache (private ones included) may store them. */
export const ANALYTICS_CACHE_CONTROL = 'private, no-store';

export const analyticsForbiddenResponses = {
  orgTeam: {
    description:
      'The key lacks the public_api:* or analytics:read scope, or the automation actor is not an org admin or tutor'
  },
  orgAdmin: {
    description: 'The key lacks the public_api:* or analytics:read scope, or the automation actor is not an org admin'
  },
  courseTeam: {
    description:
      'The key lacks the public_api:* or analytics:read scope, or the automation actor is not a course tutor/admin or org admin'
  }
};
