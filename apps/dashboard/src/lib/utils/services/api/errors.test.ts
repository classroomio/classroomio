import { describe, expect, it } from 'vitest';

import { ErrorCodes } from '@cio/utils/constants';

import { hasErrorCode, matchesError, toNormalizedApiError } from './errors';
import { ApiError } from './types';

describe('toNormalizedApiError', () => {
  it('normalizes a success:false body with error, code and field', () => {
    const normalized = toNormalizedApiError({
      success: false,
      error: 'Site name already exists',
      code: 'SITENAME_EXISTS',
      field: 'siteName'
    });

    expect(normalized.message).toBe('Site name already exists');
    expect(normalized.code).toBe('SITENAME_EXISTS');
    expect(normalized.field).toBe('siteName');
  });

  it('prefers error over message and tolerates missing code', () => {
    const normalized = toNormalizedApiError({ success: false, error: 'Nope' });

    expect(normalized.message).toBe('Nope');
    expect(normalized.code).toBeUndefined();
  });

  it('reads message-shaped bodies from ad-hoc routes', () => {
    const normalized = toNormalizedApiError({ success: false, message: 'Missing assetId' });

    expect(normalized.message).toBe('Missing assetId');
  });

  it('recovers structured errors carried as ApiError message', () => {
    const body = JSON.stringify({
      success: false,
      error: 'Site name already exists',
      code: 'SITENAME_EXISTS',
      field: 'siteName'
    });
    const normalized = toNormalizedApiError(new ApiError(body, 409, 'Conflict'));

    expect(normalized.message).toBe('Site name already exists');
    expect(normalized.code).toBe('SITENAME_EXISTS');
    expect(normalized.field).toBe('siteName');
    expect(normalized.status).toBe(409);
  });

  it('falls back to plain text for non-JSON ApiError messages', () => {
    const normalized = toNormalizedApiError(new ApiError('Network error', 0, 'Network Error'));

    expect(normalized.message).toBe('Network error');
    expect(normalized.code).toBeUndefined();
  });

  it('normalizes plain Error and string inputs', () => {
    expect(toNormalizedApiError(new Error('boom')).message).toBe('boom');
    expect(toNormalizedApiError('plain failure').message).toBe('plain failure');
  });
});

describe('hasErrorCode', () => {
  it('matches one of several codes', () => {
    const error = toNormalizedApiError({
      success: false,
      error: 'x',
      code: ErrorCodes.UPGRADE_REQUIRED
    });

    expect(hasErrorCode(error, ErrorCodes.UPGRADE_REQUIRED)).toBe(true);
    expect(hasErrorCode(error, ErrorCodes.FORBIDDEN, ErrorCodes.UPGRADE_REQUIRED)).toBe(true);
    expect(hasErrorCode(error, ErrorCodes.FORBIDDEN)).toBe(false);
  });

  it('returns false without a code', () => {
    expect(hasErrorCode(toNormalizedApiError(new Error('boom')), ErrorCodes.FORBIDDEN)).toBe(false);
  });
});

describe('matchesError', () => {
  it('matches code and field together', () => {
    const error = toNormalizedApiError({
      success: false,
      error: 'Bad deadline',
      code: ErrorCodes.VALIDATION_ERROR,
      field: 'certificate.deadline'
    });

    expect(matchesError(error, { code: ErrorCodes.VALIDATION_ERROR })).toBe(true);
    expect(matchesError(error, { code: ErrorCodes.VALIDATION_ERROR, field: 'certificate.deadline' })).toBe(true);
    expect(matchesError(error, { field: 'other' })).toBe(false);
    expect(matchesError(error, { code: ErrorCodes.FORBIDDEN })).toBe(false);
  });
});
