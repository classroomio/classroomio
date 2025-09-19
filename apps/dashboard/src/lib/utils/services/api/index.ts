import { type ApiClientConfig, ApiError, type RequestConfig } from './types';

import { DEFAULT_CONFIG } from './constants';
import { delay } from './utils';
import { env } from '$env/dynamic/public';
import { getAccessToken } from '$lib/utils/functions/supabase';
import { hcWithType } from '@cio/api/rpc-types';

class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async makeRequest(
    input: RequestInfo | URL,
    requestConfig: RequestConfig = {}
  ): Promise<Response> {
    console.log('makeRequest', input, requestConfig);
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      skipAuth = false,
      ...fetchConfig
    } = requestConfig;

    const url = typeof input === 'string' ? input : input.toString();
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;

    // Prepare headers
    const headers = new Headers(fetchConfig.headers);

    // Add default headers
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    // Handle body serialization and content-type
    let requestBody = fetchConfig.body;
    if (
      fetchConfig.body &&
      typeof fetchConfig.body === 'object' &&
      !(fetchConfig.body instanceof FormData)
    ) {
      // Auto-stringify objects (except FormData)
      requestBody = JSON.stringify(fetchConfig.body);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    } else if (fetchConfig.body && !headers.has('Content-Type')) {
      // Set content-type for other body types if not already set
      if (typeof fetchConfig.body === 'string') {
        headers.set('Content-Type', 'text/plain');
      }
    }

    // Add authentication if not skipped
    if (!skipAuth) {
      try {
        const token = await getAccessToken();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } catch (error) {
        console.warn('Failed to get access token:', error);
        // Continue without auth if token retrieval fails
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestInit: RequestInit = {
      ...fetchConfig,
      headers,
      body: requestBody,
      signal: controller.signal
    };

    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.config.customFetch(fullUrl, requestInit);

        clearTimeout(timeoutId);

        await this.config.onResponse(response);

        if (response.ok) {
          return response;
        }

        if (response.status === 401) {
          await this.config.onAuthError();
          throw new ApiError(
            'Authentication failed',
            response.status,
            response.statusText,
            response
          );
        }

        if (response.status >= 400 && response.status < 500) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new ApiError(
            `Client error: ${errorText}`,
            response.status,
            response.statusText,
            response
          );
        }

        if (response.status >= 500) {
          const error = new ApiError(
            `Server error: ${response.statusText}`,
            response.status,
            response.statusText,
            response
          );

          if (attempt === retries) {
            throw error;
          }

          lastError = error;
          await delay(this.config.retryDelay * Math.pow(2, attempt));
          continue;
        }

        // Other status codes
        throw new ApiError(
          `Unexpected status: ${response.statusText}`,
          response.status,
          response.statusText,
          response
        );
      } catch (error) {
        clearTimeout(timeoutId);

        // Handle abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, 'Request Timeout');
        }

        // Handle network errors - retryable
        if (error instanceof TypeError && error.message.includes('fetch')) {
          const networkError = new ApiError('Network error', 0, 'Network Error');

          if (attempt === retries) {
            await this.config.onNetworkError(networkError);
            throw networkError;
          }

          lastError = networkError;
          await delay(this.config.retryDelay * Math.pow(2, attempt));
          continue;
        }

        // Re-throw non-retryable errors
        throw error;
      }
    }

    // If we get here, all retries failed
    throw lastError || new ApiError('Request failed after all retries');
  }

  // Generic request method - handles all HTTP methods
  async request(input: RequestInfo | URL, config: RequestConfig = {}): Promise<Response> {
    return this.makeRequest(input, config);
  }

  // Update configuration
  updateConfig(newConfig: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create default instance
export const apiClient = new ApiClient();

// RPC client using the new fetch wrapper
export const classroomio = hcWithType(env.PUBLIC_SERVER_URL, {
  fetch: async (input: RequestInfo | URL, requestInit?: RequestInit) => {
    return apiClient.request(input, requestInit);
  }
});

// Utility functions for common use cases
export const createApiClient = (config: ApiClientConfig) => new ApiClient(config);

// Re-export utility functions for convenience
export {
  handleJsonResponse,
  handleTextResponse,
  isApiError,
  isNetworkError,
  isAuthError,
  isClientError,
  isServerError,
  isTimeoutError,
  safeRequest,
  safeRequestText,
  safeRequestRaw,
  type Result
} from './utils';

export type { InferResponseType, InferRequestType } from '@cio/api/rpc-types';
