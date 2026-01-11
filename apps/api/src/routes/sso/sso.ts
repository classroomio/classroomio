/**
 * SSO Routes
 * Handles SSO authentication flow for organizations
 */

import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  initiateSsoAuth,
  handleSsoCallback,
  getSsoConfigForLogin,
  getSsoConfigByOrgId,
  upsertSsoConfig,
  deleteSsoConfig,
  toggleSsoEnabled,
  parseSamlMetadata,
  type SsoProviderType
} from '@cio/db/queries';
import { auth } from '@cio/db';

// Validation schemas
const ZInitiateSso = z.object({
  organizationId: z.string().uuid(),
  redirectUrl: z.string().url().optional()
});

const ZSsoCallback = z.object({
  state: z.string(),
  code: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional()
});

const ZGetSsoConfig = z.object({
  organizationId: z.string().uuid()
});

const ZUpsertSsoConfig = z.object({
  providerType: z.enum(['saml', 'oidc']),
  providerName: z.string(),
  displayName: z.string().optional(),
  enabled: z.boolean().optional(),
  samlConfig: z
    .object({
      idpEntityId: z.string().optional(),
      idpSsoUrl: z.string().url().optional(),
      idpCertificate: z.string().optional(),
      spEntityId: z.string().optional(),
      spAcsUrl: z.string().url().optional(),
      signatureAlgorithm: z.enum(['sha256', 'sha512']).optional(),
      nameIdFormat: z.string().optional()
    })
    .optional(),
  oidcConfig: z
    .object({
      issuerUrl: z.string().url().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      authorizationUrl: z.string().url().optional(),
      tokenUrl: z.string().url().optional(),
      userInfoUrl: z.string().url().optional(),
      scopes: z.array(z.string()).optional()
    })
    .optional(),
  forceSso: z.boolean().optional(),
  autoProvisionUsers: z.boolean().optional(),
  allowedDomains: z.array(z.string()).optional(),
  defaultRoleId: z.number().optional(),
  attributeMapping: z
    .object({
      email: z.string().optional(),
      name: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      avatar: z.string().optional()
    })
    .optional()
});

const ZToggleSso = z.object({
  enabled: z.boolean()
});

const ZParseSamlMetadata = z.object({
  metadataXml: z.string()
});

export const ssoRouter = new Hono()
  /**
   * GET /sso/config/public
   * Gets public SSO configuration for login page
   * Query params: organizationId (string)
   * No authentication required
   */
  .get('/config/public', zValidator('query', ZGetSsoConfig), async (c) => {
    try {
      const { organizationId } = c.req.valid('query');
      const config = await getSsoConfigForLogin(organizationId);

      return c.json(
        {
          success: true,
          data: config
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch SSO configuration');
    }
  })

  /**
   * GET /sso/config
   * Gets full SSO configuration for organization settings
   * Requires authentication and admin role
   */
  .get('/config', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const config = await getSsoConfigByOrgId(orgId);

      // Mask sensitive data
      if (config?.oidcConfig?.clientSecret) {
        config.oidcConfig.clientSecret = '********';
      }

      return c.json(
        {
          success: true,
          data: config
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch SSO configuration');
    }
  })

  /**
   * POST /sso/config
   * Creates or updates SSO configuration
   * Requires authentication and admin role
   */
  .post('/config', authMiddleware, orgAdminMiddleware, zValidator('json', ZUpsertSsoConfig), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = c.req.valid('json');

      const config = await upsertSsoConfig({
        organizationId: orgId,
        providerType: data.providerType as SsoProviderType,
        providerName: data.providerName,
        displayName: data.displayName,
        enabled: data.enabled,
        samlConfig: data.samlConfig,
        oidcConfig: data.oidcConfig,
        forceSso: data.forceSso,
        autoProvisionUsers: data.autoProvisionUsers,
        allowedDomains: data.allowedDomains,
        defaultRoleId: data.defaultRoleId,
        attributeMapping: data.attributeMapping
      });

      // Mask sensitive data in response
      if (config?.oidcConfig?.clientSecret) {
        config.oidcConfig.clientSecret = '********';
      }

      return c.json(
        {
          success: true,
          data: config
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to save SSO configuration');
    }
  })

  /**
   * PUT /sso/config/toggle
   * Enables or disables SSO for organization
   * Requires authentication and admin role
   */
  .put('/config/toggle', authMiddleware, orgAdminMiddleware, zValidator('json', ZToggleSso), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { enabled } = c.req.valid('json');

      const config = await toggleSsoEnabled(orgId, enabled);

      if (!config) {
        return c.json(
          {
            success: false,
            error: 'SSO configuration not found. Please configure SSO first.'
          },
          404
        );
      }

      return c.json(
        {
          success: true,
          data: { enabled: config.enabled }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to toggle SSO');
    }
  })

  /**
   * DELETE /sso/config
   * Deletes SSO configuration for organization
   * Requires authentication and admin role
   */
  .delete('/config', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;

      await deleteSsoConfig(orgId);

      return c.json(
        {
          success: true
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to delete SSO configuration');
    }
  })

  /**
   * POST /sso/saml/parse-metadata
   * Parses SAML IdP metadata XML and extracts configuration
   * Requires authentication and admin role
   */
  .post(
    '/saml/parse-metadata',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('json', ZParseSamlMetadata),
    async (c) => {
      try {
        const { metadataXml } = c.req.valid('json');
        const config = parseSamlMetadata(metadataXml);

        return c.json(
          {
            success: true,
            data: config
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to parse SAML metadata');
      }
    }
  )

  /**
   * POST /sso/initiate
   * Initiates SSO authentication flow
   * No authentication required (user is trying to log in)
   */
  .post('/initiate', zValidator('json', ZInitiateSso), async (c) => {
    try {
      const { organizationId, redirectUrl } = c.req.valid('json');

      // Get the callback URL from the current request
      const baseUrl = new URL(c.req.url).origin;
      const callbackUrl = `${baseUrl}/sso/callback`;

      const result = await initiateSsoAuth(organizationId, callbackUrl, redirectUrl);

      return c.json(
        {
          success: true,
          data: result
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to initiate SSO');
    }
  })

  /**
   * GET /sso/callback
   * Handles SSO callback from identity provider (OIDC)
   * Creates or updates user and establishes session
   */
  .get('/callback', zValidator('query', ZSsoCallback), async (c) => {
    try {
      const { state, code, error, error_description } = c.req.valid('query');

      // Get callback URL
      const callbackUrl = new URL(c.req.url).origin + '/sso/callback';

      const result = await handleSsoCallback(
        {
          state,
          code,
          error,
          errorDescription: error_description
        },
        callbackUrl
      );

      // Create session using Better Auth
      // We need to create a session for the authenticated user
      const sessionToken = await createSsoSession(result.user.id);

      // Determine redirect URL
      const redirectUrl = result.redirectUrl || '/';

      // Set session cookie and redirect
      // Better Auth typically handles this, but for SSO we need to do it manually
      c.header(
        'Set-Cookie',
        `classroomio.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      );

      return c.redirect(redirectUrl);
    } catch (error) {
      console.error('SSO callback error:', error);
      // Redirect to login with error
      const errorMessage = encodeURIComponent(error instanceof Error ? error.message : 'SSO authentication failed');
      return c.redirect(`/login?error=${errorMessage}`);
    }
  })

  /**
   * POST /sso/callback
   * Handles SSO callback from identity provider (SAML POST binding)
   */
  .post('/callback', async (c) => {
    try {
      const formData = await c.req.formData();
      const samlResponse = formData.get('SAMLResponse') as string;
      const relayState = formData.get('RelayState') as string;

      if (!samlResponse || !relayState) {
        throw new Error('Missing SAML response or relay state');
      }

      // Get callback URL
      const callbackUrl = new URL(c.req.url).origin + '/sso/callback';

      const result = await handleSsoCallback(
        {
          state: relayState,
          samlResponse
        },
        callbackUrl
      );

      // Create session using Better Auth
      const sessionToken = await createSsoSession(result.user.id);

      // Determine redirect URL
      const redirectUrl = result.redirectUrl || '/';

      // Set session cookie and redirect
      c.header(
        'Set-Cookie',
        `classroomio.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      );

      return c.redirect(redirectUrl);
    } catch (error) {
      console.error('SAML callback error:', error);
      const errorMessage = encodeURIComponent(error instanceof Error ? error.message : 'SAML authentication failed');
      return c.redirect(`/login?error=${errorMessage}`);
    }
  });

/**
 * Create a session for SSO user using Better Auth's internal methods
 */
async function createSsoSession(userId: string): Promise<string> {
  // Generate session token
  const crypto = await import('crypto');
  const sessionToken = crypto.randomBytes(32).toString('base64url');

  // Create session in database
  const { db } = await import('@cio/db');
  const { session } = await import('@cio/db/schema');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await db.insert(session).values({
    token: sessionToken,
    userId,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return sessionToken;
}
