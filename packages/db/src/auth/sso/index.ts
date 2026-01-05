/**
 * SSO Module - Single Sign-On for Organizations
 * 
 * Supports:
 * - OIDC (OpenID Connect): Auth0, Okta, Google Workspace, Azure AD
 * - SAML 2.0: Okta, Azure AD, OneLogin, custom SAML providers
 * 
 * Features:
 * - Per-organization SSO configuration
 * - JIT (Just-In-Time) user provisioning
 * - Domain restriction
 * - Force SSO (disable email/password login)
 * - Customizable attribute mapping
 */

// Main handler
export {
  initiateSsoAuth,
  handleSsoCallback,
  getSsoConfigForLogin,
  parseSamlMetadata,
  type SsoAuthResult
} from './handler';

// Queries
export {
  getSsoConfigByOrgId,
  getSsoConfigById,
  upsertSsoConfig,
  deleteSsoConfig,
  toggleSsoEnabled,
  isOrgSsoEnabled,
  isOrgSsoForced,
  createSsoSession,
  getSsoSessionByState,
  updateSsoSession,
  cleanupExpiredSsoSessions
} from './queries';

// Types
export {
  type SsoProviderType,
  type SsoProviderName,
  type SamlConfig,
  type OidcConfig,
  type AttributeMapping,
  type SsoConfig,
  type SsoSession,
  type SsoUserInfo,
  type SsoInitiateRequest,
  type SsoCallbackRequest,
  type SsoInitiateResponse,
  PROVIDER_CONFIGS
} from './types';

// OIDC-specific (for advanced use cases)
export { initiateOidcAuth, handleOidcCallback } from './oidc';

// SAML-specific (for advanced use cases)
export { initiateSamlAuth, handleSamlCallback } from './saml';
