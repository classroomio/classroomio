import type { ZodError } from 'zod';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  customFetch?: typeof fetch;
  onAuthError?: () => Promise<void> | void;
  onNetworkError?: (error: Error) => Promise<void> | void;
  onResponse?: (response: Response) => Promise<void> | void;
}

export type ZodValidationError = {
  message: string; // stringified error.issues from zod
  name: 'ZodError';
};

export type ZodValidatorMesssage = ZodError['issues'];

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  public readonly error_code: string;

  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';

    // Determine error code based on status
    if (status === 401) {
      this.error_code = 'auth';
    } else if (status && status >= 400 && status < 500) {
      this.error_code = 'client';
    } else if (status && status >= 500) {
      this.error_code = 'server';
    } else if (status === 408) {
      this.error_code = 'timeout';
    } else if (status === 0 || !status) {
      this.error_code = 'network';
    } else {
      this.error_code = 'unknown';
    }
  }
}
