import { ApiClientConfig } from './types';
import { env } from '$env/dynamic/public';

// Default configuration
export const DEFAULT_CONFIG: Required<ApiClientConfig> = {
  baseURL: env.PUBLIC_SERVER_URL || '',
  timeout: 30000, // 30 seconds
  retries: 1,
  retryDelay: 1000, // 1 second
  customFetch: fetch,
  onAuthError: async () => {
    // Default: redirect to login or refresh token
    console.warn('Authentication error occurred. Consider redirecting to login.');
  },
  onNetworkError: async (error: Error) => {
    console.error('Network error:', error);
  },
  onResponse: async (response: Response) => {
    // Default: log response for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.statusText}`);
    }
  }
};
