import { ApiError } from './types';

export type NormalizedApiError = {
  message: string;
  code?: string;
  field?: string;
  status?: number;
  raw: unknown;
};

export type ApiErrorMatch = {
  code?: string;
  field?: string;
};

function readStringField(source: object, key: string): string | undefined {
  if (!(key in source)) return undefined;

  const value = (source as Record<string, unknown>)[key];

  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function fromBodyObject(body: object, status?: number, raw?: unknown): NormalizedApiError | null {
  const errorMessage = readStringField(body, 'error') ?? readStringField(body, 'message');

  if (!errorMessage) return null;

  return {
    message: errorMessage,
    code: readStringField(body, 'code'),
    field: readStringField(body, 'field'),
    status,
    raw: raw ?? body
  };
}

function tryParseJsonObject(text: string): object | null {
  try {
    const parsed = JSON.parse(text) as unknown;

    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Normalizes every failure shape reaching `BaseApi.execute()` into one typed object.
 */
export function toNormalizedApiError(input: unknown, fallbackStatus?: number): NormalizedApiError {
  if (input instanceof ApiError) {
    const parsed = tryParseJsonObject(input.message);
    if (parsed) {
      const fromBody = fromBodyObject(parsed, input.status, parsed);
      if (fromBody) return fromBody;
    }

    return {
      message: input.message || 'Something went wrong',
      status: input.status,
      raw: input
    };
  }

  if (typeof input === 'object' && input !== null) {
    if ('success' in input && (input as { success: unknown }).success === false) {
      const fromBody = fromBodyObject(input, fallbackStatus, input);
      if (fromBody) return fromBody;
    }

    const direct = fromBodyObject(input, fallbackStatus, input);
    if (direct) return direct;

    if (input instanceof Error) {
      return { message: input.message || 'Something went wrong', raw: input };
    }

    return { message: 'Something went wrong', raw: input };
  }

  if (typeof input === 'string') {
    const parsed = tryParseJsonObject(input);
    if (parsed) {
      const fromBody = fromBodyObject(parsed, fallbackStatus, parsed);
      if (fromBody) return fromBody;

      const nested = readStringField(parsed, 'error') ?? readStringField(parsed, 'message');
      if (nested) {
        return {
          message: nested,
          code: readStringField(parsed, 'code'),
          field: readStringField(parsed, 'field'),
          status: fallbackStatus,
          raw: parsed
        };
      }
    }

    return {
      message: input || 'Something went wrong',
      status: fallbackStatus,
      raw: input
    };
  }

  if (input instanceof Error) {
    return { message: input.message || 'Something went wrong', raw: input };
  }

  return { message: 'Something went wrong', status: fallbackStatus, raw: input };
}

/**
 * Checks whether a normalized API error carries one of the given codes.
 */
export function hasErrorCode(error: NormalizedApiError, ...codes: string[]): boolean {
  if (!error.code) return false;

  return codes.includes(error.code);
}

/**
 * Checks whether a normalized API error matches every provided criterion.
 */
export function matchesError(error: NormalizedApiError, match: ApiErrorMatch): boolean {
  if (match.code !== undefined && error.code !== match.code) return false;
  if (match.field !== undefined && error.field !== match.field) return false;

  return true;
}
