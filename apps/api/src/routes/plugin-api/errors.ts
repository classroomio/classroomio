import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppError } from '@api/utils/errors';
import { randomUUID } from 'crypto';

const RETRYABLE_CODES = new Set(['RATE_LIMITED', 'SERVICE_UNAVAILABLE']);

const PUBLIC_ERROR_CODES: Record<string, string> = {
  UNAUTHORIZED: 'authentication_failed',
  FORBIDDEN: 'permission_denied',
  PLUGIN_PERMISSION_DENIED: 'permission_denied',
  PLUGIN_STORAGE_ADMIN_REQUIRED: 'permission_denied',
  INSTALLATION_NOT_ACTIVE: 'installation_inactive',
  NOT_FOUND: 'resource_not_found',
  INSTALLATION_NOT_FOUND: 'resource_not_found',
  COURSE_NOT_FOUND: 'resource_not_found',
  LESSON_NOT_FOUND: 'resource_not_found',
  ENROLLMENT_NOT_FOUND: 'resource_not_found',
  EXERCISE_NOT_FOUND: 'resource_not_found',
  CERTIFICATE_NOT_FOUND: 'resource_not_found',
  STORAGE_KEY_NOT_FOUND: 'resource_not_found',
  VALIDATION_ERROR: 'validation_failed',
  INVALID_STORAGE_NAMESPACE: 'validation_failed',
  INVALID_STORAGE_KEY: 'validation_failed',
  PAYLOAD_TOO_LARGE: 'payload_too_large',
  PLUGIN_STORAGE_QUOTA_EXCEEDED: 'quota_exceeded',
  RATE_LIMITED: 'rate_limited',
  INTERNAL_ERROR: 'internal_error'
};

export function handlePluginApiError(c: Context, error: unknown, fallbackMessage: string): Response {
  const requestId = (c.get('pluginApiRequestId') as string | null) ?? randomUUID();
  const status = error instanceof AppError ? error.statusCode : 500;
  const internalCode = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
  const code = PUBLIC_ERROR_CODES[internalCode] ?? internalCode.toLowerCase();
  const message = error instanceof AppError && status < 500 ? error.message : fallbackMessage;

  return c.json(
    {
      success: false as const,
      error: {
        code,
        message,
        retryable: RETRYABLE_CODES.has(error instanceof AppError ? error.code : '')
      },
      requestId
    },
    status as ContentfulStatusCode
  );
}
