import { ORG_ADMIN_FORBIDDEN } from '../team/docs';

export { ORG_ADMIN_RULE } from '../team/docs';

export const EMAIL_TEMPLATES_TAG = 'Organization Email Templates';
export const LANDING_PAGE_TAG = 'Organization Landing Page';

/** Templates change whenever an admin edits them, so no cache (private ones included) may store them. */
export const EMAIL_TEMPLATES_CACHE_CONTROL = 'private, no-store';

export const DELIVERY_NOTE =
  'students get a saved template only on a paid plan, and a non-English one only when the organization enforces that language';

export const organizationForbiddenResponse = (scope: 'organization:read' | 'organization:write') => ({
  description: `The key has neither the public_api:* nor the ${scope} scope, or ${ORG_ADMIN_FORBIDDEN}`
});

export const organizationPlanForbiddenResponse = {
  description: `${organizationForbiddenResponse('organization:write').description} Also returned with code UPGRADE_REQUIRED when the organization is on the free plan.`
};
