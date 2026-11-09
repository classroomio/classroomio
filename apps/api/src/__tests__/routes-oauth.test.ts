import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

const mocks = vi.hoisted(() => ({
  listOAuthOrganizationsService: vi.fn(),
  getOAuthClientTrustService: vi.fn(),
  getSelectedOAuthOrganizationService: vi.fn(),
  selectOAuthOrganizationService: vi.fn()
}));

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: Context, next: Next) => {
    c.set('user', { id: 'user-1' });
    c.set('session', { id: 'session-1' });
    await next();
  }
}));

vi.mock('@api/services/oauth/oauth', () => ({
  listOAuthOrganizationsService: mocks.listOAuthOrganizationsService,
  getOAuthClientTrustService: mocks.getOAuthClientTrustService,
  getSelectedOAuthOrganizationService: mocks.getSelectedOAuthOrganizationService,
  selectOAuthOrganizationService: mocks.selectOAuthOrganizationService
}));

import { oauthRouter } from '@api/routes/oauth/oauth';

describe('OAuth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /organizations', () => {
    it('calls listOAuthOrganizationsService without resource when query is omitted', async () => {
      mocks.listOAuthOrganizationsService.mockResolvedValue([
        { id: 'org-1', name: 'Org 1', siteName: 'org-1', avatarUrl: null, eligible: true, reason: null }
      ]);

      const response = await oauthRouter.request('/organizations');
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([
        { id: 'org-1', name: 'Org 1', siteName: 'org-1', avatarUrl: null, eligible: true, reason: null }
      ]);
      expect(mocks.listOAuthOrganizationsService).toHaveBeenCalledWith('user-1', undefined);
    });

    it('passes resource query param to listOAuthOrganizationsService and returns eligibility', async () => {
      const resourceUrl = 'http://localhost:3002/public-api/v1';
      mocks.listOAuthOrganizationsService.mockResolvedValue([
        { id: 'org-basic', name: 'Basic Org', siteName: 'basic', avatarUrl: null, eligible: false, reason: 'plan' },
        { id: 'org-early', name: 'Early Org', siteName: 'early', avatarUrl: null, eligible: true, reason: null }
      ]);

      const response = await oauthRouter.request(`/organizations?resource=${encodeURIComponent(resourceUrl)}`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([
        { id: 'org-basic', name: 'Basic Org', siteName: 'basic', avatarUrl: null, eligible: false, reason: 'plan' },
        { id: 'org-early', name: 'Early Org', siteName: 'early', avatarUrl: null, eligible: true, reason: null }
      ]);
      expect(mocks.listOAuthOrganizationsService).toHaveBeenCalledWith('user-1', resourceUrl);
    });
  });

  describe('GET /clients/:clientId', () => {
    it('returns client trust details for a valid client id', async () => {
      mocks.getOAuthClientTrustService.mockReturnValue({
        clientId: 'zapier-client-123',
        trusted: true,
        kind: 'zapier'
      });

      const response = await oauthRouter.request('/clients/zapier-client-123');
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual({
        clientId: 'zapier-client-123',
        trusted: true,
        kind: 'zapier'
      });
      expect(mocks.getOAuthClientTrustService).toHaveBeenCalledWith('zapier-client-123');
    });

    it('returns 400 when client id exceeds max length', async () => {
      const longClientId = 'a'.repeat(256);
      const response = await oauthRouter.request(`/clients/${longClientId}`);

      expect(response.status).toBe(400);
      expect(mocks.getOAuthClientTrustService).not.toHaveBeenCalled();
    });
  });
});
