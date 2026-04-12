/** Backend error JSON from API `handleError` responses (also carried as thrown `ApiError.message` on 4xx). */
export type ApiErrorBody = {
  success: false;
  error: string;
  code: string;
  field?: string;
};

/**
 * Parses `this.error` / ApiError.message when the API returned a JSON body with `success: false`.
 */
export function tryParseApiErrorBody(raw: string | null | undefined): ApiErrorBody | null {
  if (!raw?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'success' in parsed &&
      (parsed as { success: unknown }).success === false &&
      'code' in parsed &&
      typeof (parsed as { code: unknown }).code === 'string' &&
      'error' in parsed &&
      typeof (parsed as { error: unknown }).error === 'string'
    ) {
      return parsed as ApiErrorBody;
    }
  } catch {
    // not JSON
  }

  return null;
}
