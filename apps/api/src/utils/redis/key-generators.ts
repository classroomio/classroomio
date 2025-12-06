/**
 * Key generation utilities for rate limiting
 * These functions help create consistent and secure rate limit keys
 */

import type { Context } from 'hono';

/**
 * Extract real client IP address considering various proxy headers
 */
export const extractClientIp = (c: Context): string => {
  // Priority order (most trusted first):
  // 1. CF-Connecting-IP (Cloudflare)
  // 2. X-Real-IP (nginx)
  // 3. X-Forwarded-For (standard, but can be spoofed)
  // 4. Connection IP (least reliable)

  const cfConnectingIp = c.req.header('cf-connecting-ip');
  const realIp = c.req.header('x-real-ip');
  const forwardedFor = c.req.header('x-forwarded-for');

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  if (realIp) {
    return realIp;
  }

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    // The first IP is usually the original client
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback - this might be a proxy IP
  return 'unknown';
};

/**
 * Generate rate limit key for authenticated users
 */
export const userKeyGenerator = (c: Context): string => {
  const user = c.get('user'); // Already extracted by global middleware

  if (user?.id) {
    return `user:${user.id}`;
  }

  // No valid auth, fall back to IP
  return `ip:${extractClientIp(c)}`;
};

/**
 * Generate rate limit key for API keys
 */
export const apiKeyGenerator = (c: Context): string => {
  const apiKey = c.req.header('X-API-Key');

  if (apiKey) {
    return `api:${apiKey}`;
  }

  // Fallback to IP if no API key
  return `ip:${extractClientIp(c)}`;
};

/**
 * Generate rate limit key based on IP only
 */
export const ipKeyGenerator = (c: Context): string => {
  return `ip:${extractClientIp(c)}`;
};

/**
 * Generate rate limit key for specific endpoints
 */
export const endpointKeyGenerator =
  (endpoint: string) =>
  (c: Context): string => {
    const baseKey = userKeyGenerator(c);
    return `${baseKey}:${endpoint}`;
  };
