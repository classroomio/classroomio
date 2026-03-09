import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from '@api/utils/hono';
import { apiKeyRouter } from '@api/routes/public-api/api-key';
import * as publicApiService from '@api/services/public-api';
import { mockUser, mockOrgId, mockApiKey, mockRawApiKey } from './test-fixtures';
import { AppError, ErrorCodes } from '@api/utils/errors';

// Mock the services
vi.mock('@api/services/public-api');

// Mock auth middlewares
vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: vi.fn(async (c, next) => {
    c.set('user', mockUser);
    await next();
  })
}));

vi.mock('@api/middlewares/org-admin', () => ({
  orgAdminMiddleware: vi.fn(async (c, next) => {
    await next();
  })
}));

describe('API Key Management Routes', () => {
  let app: InstanceType<typeof Hono>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a test app with just the API key router
    app = new Hono().route('/', apiKeyRouter);
  });

  describe('POST /api-key - Create API Key', () => {
    it('should create API key with valid data', async () => {
      const mockResult = {
        rawKey: mockRawApiKey,
        keyId: mockApiKey.id,
        keyPrefix: mockApiKey.keyPrefix,
        name: 'Production API',
        createdAt: mockApiKey.createdAt
      };

      vi.mocked(publicApiService.createApiKey).mockResolvedValue(mockResult);

      const response = await app.request('/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': mockOrgId
        },
        body: JSON.stringify({ name: 'Production API' })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.rawKey).toBe(mockRawApiKey);
      expect(data.data.keyPrefix).toBe(mockApiKey.keyPrefix);
      expect(publicApiService.createApiKey).toHaveBeenCalledWith(mockOrgId, mockUser.id, 'Production API');
    });

    it('should create API key with default name when name not provided', async () => {
      const mockResult = {
        rawKey: mockRawApiKey,
        keyId: mockApiKey.id,
        keyPrefix: mockApiKey.keyPrefix,
        name: 'Default',
        createdAt: mockApiKey.createdAt
      };

      vi.mocked(publicApiService.createApiKey).mockResolvedValue(mockResult);

      const response = await app.request('/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': mockOrgId
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Default');
    });

    it('should return 400 for invalid request body', async () => {
      const response = await app.request('/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': mockOrgId
        },
        body: JSON.stringify({ name: 123 }) // name should be string
      });

      expect(response.status).toBe(400);
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(publicApiService.createApiKey).mockRejectedValue(
        new AppError('Database error', ErrorCodes.API_KEY_CREATE_FAILED, 500)
      );

      const response = await app.request('/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': mockOrgId
        },
        body: JSON.stringify({ name: 'Test' })
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api-key - List API Keys', () => {
    it('should list all API keys for organization', async () => {
      const mockKeys = [
        {
          id: mockApiKey.id,
          keyPrefix: mockApiKey.keyPrefix,
          name: mockApiKey.name,
          lastUsedAt: null,
          expiresAt: null,
          isRevoked: false,
          createdAt: mockApiKey.createdAt
        },
        {
          id: 'key-test-999',
          keyPrefix: 'cio_live_xyz',
          name: 'Another Key',
          lastUsedAt: new Date('2026-03-05T00:00:00Z'),
          expiresAt: null,
          isRevoked: false,
          createdAt: new Date('2026-03-02T00:00:00Z')
        }
      ];

      vi.mocked(publicApiService.listApiKeys).mockResolvedValue(mockKeys);

      const response = await app.request('/api-key', {
        method: 'GET',
        headers: {
          'cio-org-id': mockOrgId
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].keyPrefix).toBe(mockApiKey.keyPrefix);
      expect(publicApiService.listApiKeys).toHaveBeenCalledWith(mockOrgId);
    });

    it('should return empty array when no keys exist', async () => {
      vi.mocked(publicApiService.listApiKeys).mockResolvedValue([]);

      const response = await app.request('/api-key', {
        method: 'GET',
        headers: {
          'cio-org-id': mockOrgId
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(publicApiService.listApiKeys).mockRejectedValue(
        new AppError('Database error', ErrorCodes.API_KEY_LIST_FAILED, 500)
      );

      const response = await app.request('/api-key', {
        method: 'GET',
        headers: {
          'cio-org-id': mockOrgId
        }
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api-key/:keyId - Revoke API Key', () => {
    it('should revoke API key successfully', async () => {
      vi.mocked(publicApiService.revokeApiKey).mockResolvedValue({
        success: true,
        message: 'API key revoked successfully'
      });

      // Use a valid UUID format
      const validKeyId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await app.request(`/api-key/${validKeyId}`, {
        method: 'DELETE',
        headers: {
          'cio-org-id': mockOrgId
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('API key revoked successfully');
      expect(publicApiService.revokeApiKey).toHaveBeenCalledWith(validKeyId, mockOrgId);
    });

    it('should return 400 for invalid keyId format', async () => {
      const response = await app.request('/api-key/invalid-uuid', {
        method: 'DELETE',
        headers: {
          'cio-org-id': mockOrgId
        }
      });

      expect(response.status).toBe(400);
    });

    it('should return 404 when key not found', async () => {
      vi.mocked(publicApiService.revokeApiKey).mockRejectedValue(
        new AppError('API key not found or does not belong to this organization', ErrorCodes.API_KEY_NOT_FOUND, 404)
      );

      // Use a valid UUID format
      const validKeyId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await app.request(`/api-key/${validKeyId}`, {
        method: 'DELETE',
        headers: {
          'cio-org-id': mockOrgId
        }
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should return 400 when key is already revoked', async () => {
      vi.mocked(publicApiService.revokeApiKey).mockRejectedValue(
        new AppError('API key is already revoked', ErrorCodes.API_KEY_ALREADY_REVOKED, 400)
      );

      // Use a valid UUID format
      const validKeyId = '123e4567-e89b-12d3-a456-426614174001';

      const response = await app.request(`/api-key/${validKeyId}`, {
        method: 'DELETE',
        headers: {
          'cio-org-id': mockOrgId
        }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});
