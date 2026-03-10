import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publicApiKeyMiddleware } from '@api/middlewares/public-api-key';
import * as publicApiService from '@api/services/public-api';
import { mockApiKey, mockOrgId, mockRawApiKey, mockUser } from './test-fixtures';
import { AppError, ErrorCodes } from '@api/utils/errors';

// Mock the service
vi.mock('@api/services/public-api');

describe('Public API Key Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should authenticate valid API key and set context', async () => {
    vi.mocked(publicApiService.validateApiKey).mockResolvedValue(mockApiKey);

    const mockContext = {
      req: {
        header: vi.fn((key: string) => (key === 'Authorization' ? `Bearer ${mockRawApiKey}` : null))
      },
      set: vi.fn(),
      json: vi.fn()
    };

    const mockNext = vi.fn();

    await publicApiKeyMiddleware(mockContext as any, mockNext);

    expect(publicApiService.validateApiKey).toHaveBeenCalledWith(mockRawApiKey);
    expect(mockContext.set).toHaveBeenCalledWith('orgId', mockApiKey.organizationId);
    expect(mockContext.set).toHaveBeenCalledWith('apiKey', mockApiKey);
    expect(mockContext.set).toHaveBeenCalledWith('createdByProfileId', mockApiKey.createdByProfileId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 when Authorization header is missing', async () => {
    const mockContext = {
      req: {
        header: vi.fn(() => null)
      },
      json: vi
        .fn()
        .mockReturnValue({ success: false, message: 'Unauthorized: Missing or invalid Authorization header' })
    };

    const mockNext = vi.fn();

    const result = await publicApiKeyMiddleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'Unauthorized: Missing or invalid Authorization header'
      },
      401
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header format is invalid', async () => {
    const mockContext = {
      req: {
        header: vi.fn((key: string) => (key === 'Authorization' ? 'InvalidFormat' : null))
      },
      json: vi
        .fn()
        .mockReturnValue({ success: false, message: 'Unauthorized: Missing or invalid Authorization header' })
    };

    const mockNext = vi.fn();

    await publicApiKeyMiddleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'Unauthorized: Missing or invalid Authorization header'
      },
      401
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when API key has invalid prefix', async () => {
    vi.mocked(publicApiService.validateApiKey).mockRejectedValue(
      new AppError('Invalid API key format', ErrorCodes.API_KEY_NOT_FOUND, 401)
    );

    const mockContext = {
      req: {
        header: vi.fn((key: string) => (key === 'Authorization' ? 'Bearer invalid_key_format' : null))
      },
      json: vi.fn().mockReturnValue({ success: false, message: 'Invalid API key format' })
    };

    const mockNext = vi.fn();

    await publicApiKeyMiddleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'Invalid API key format'
      },
      401
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when API key is not found', async () => {
    vi.mocked(publicApiService.validateApiKey).mockRejectedValue(
      new AppError('API key not found', ErrorCodes.API_KEY_NOT_FOUND, 401)
    );

    const mockContext = {
      req: {
        header: vi.fn((key: string) => (key === 'Authorization' ? `Bearer ${mockRawApiKey}` : null))
      },
      json: vi.fn().mockReturnValue({ success: false, message: 'API key not found' })
    };

    const mockNext = vi.fn();

    await publicApiKeyMiddleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'API key not found'
      },
      401
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when API key is revoked', async () => {
    vi.mocked(publicApiService.validateApiKey).mockRejectedValue(
      new AppError('API key has been revoked', ErrorCodes.API_KEY_ALREADY_REVOKED, 401)
    );

    const mockContext = {
      req: {
        header: vi.fn((key: string) => (key === 'Authorization' ? `Bearer ${mockRawApiKey}` : null))
      },
      json: vi.fn().mockReturnValue({ success: false, message: 'API key has been revoked' })
    };

    const mockNext = vi.fn();

    await publicApiKeyMiddleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'API key has been revoked'
      },
      401
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when API key is expired', async () => {
    vi.mocked(publicApiService.validateApiKey).mockRejectedValue(
      new AppError('API key has expired', ErrorCodes.API_KEY_NOT_FOUND, 401)
    );

    const mockContext = {
      req: {
        header: vi.fn((key: string) => (key === 'Authorization' ? `Bearer ${mockRawApiKey}` : null))
      },
      json: vi.fn().mockReturnValue({ success: false, message: 'API key has expired' })
    };

    const mockNext = vi.fn();

    await publicApiKeyMiddleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'API key has expired'
      },
      401
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 500 for unexpected errors', async () => {
    vi.mocked(publicApiService.validateApiKey).mockRejectedValue(new Error('Unexpected database error'));

    const mockContext = {
      req: {
        header: vi.fn((key: string) => (key === 'Authorization' ? `Bearer ${mockRawApiKey}` : null))
      },
      json: vi.fn().mockReturnValue({ success: false, message: 'Internal server error' })
    };

    const mockNext = vi.fn();

    await publicApiKeyMiddleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'Internal server error'
      },
      500
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});
