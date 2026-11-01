import { ZOrganizationApiKeyScope } from '@cio/utils/validation/organization';

export const OFFLINE_ACCESS_SCOPE = 'offline_access';

export const OAUTH_API_SCOPES = ZOrganizationApiKeyScope.options.filter((scope) => scope !== 'public_api:*');

export const OAUTH_SCOPES = [...OAUTH_API_SCOPES, OFFLINE_ACCESS_SCOPE];
