import { ApiError } from './types';

// Utility function for exponential backoff
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getErrMsg = (error: unknown, fallback = 'Something went wrong'): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Object && 'message' in error) {
    return error.message as string;
  }

  return fallback;
};

// Helper function to handle JSON responses
export const handleJsonResponse = async <T = any>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response.statusText,
      response
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError('Failed to parse JSON response', response.status, response.statusText, response);
  }
};

// Helper function to handle text responses
export const handleTextResponse = async (response: Response): Promise<string> => {
  if (!response.ok) {
    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response.statusText,
      response
    );
  }

  return response.text();
};

// Error handling utilities
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const isNetworkError = (error: unknown): boolean => {
  return isApiError(error) && error.status === 0;
};

export const isAuthError = (error: unknown): boolean => {
  return isApiError(error) && error.status === 401;
};

export const isClientError = (error: unknown): boolean => {
  return isApiError(error) && (error.status ?? 0) >= 400 && (error.status ?? 0) < 500;
};

export const isServerError = (error: unknown): boolean => {
  return isApiError(error) && (error.status ?? 0) >= 500;
};

export const isTimeoutError = (error: unknown): boolean => {
  return isApiError(error) && error.status === 408;
};

// Safe request wrapper that returns Result pattern
export type Result<T, E = ApiError> = { success: true; data: T } | { success: false; error: E };

// Generic safe request wrapper
export const safeRequest = async <T = any>(requestFn: () => Promise<Response>): Promise<Result<T>> => {
  try {
    const response = await requestFn();
    const data = await handleJsonResponse<T>(response);
    return { success: true, data };
  } catch (error) {
    if (isApiError(error)) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new ApiError('Unexpected error', 0, 'Unknown Error')
    };
  }
};

// Safe request wrapper for text responses
export const safeRequestText = async (requestFn: () => Promise<Response>): Promise<Result<string>> => {
  try {
    const response = await requestFn();
    const data = await handleTextResponse(response);
    return { success: true, data };
  } catch (error) {
    if (isApiError(error)) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new ApiError('Unexpected error', 0, 'Unknown Error')
    };
  }
};

// Safe request wrapper that returns the raw response
export const safeRequestRaw = async (requestFn: () => Promise<Response>): Promise<Result<Response>> => {
  try {
    const response = await requestFn();
    return { success: true, data: response };
  } catch (error) {
    if (isApiError(error)) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new ApiError('Unexpected error', 0, 'Unknown Error')
    };
  }
};
