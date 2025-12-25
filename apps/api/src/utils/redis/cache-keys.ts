/**
 * Cache key generation utilities
 * Provides consistent cache key patterns across the application
 */

import type { Context } from 'hono';

/**
 * Generate cache key for organization data
 */
export const orgCacheKey = (orgId: string): string => {
  return `org:${orgId}`;
};

/**
 * Generate cache key for organization by site name
 */
export const orgBySiteNameCacheKey = (siteName: string): string => {
  return `org:site:${siteName}`;
};

/**
 * Generate cache key for organization courses
 */
export const orgCoursesCacheKey = (siteName: string): string => {
  return `org:${siteName}:courses`;
};

/**
 * Generate cache key for organization setup data
 */
export const orgSetupCacheKey = (siteName: string): string => {
  return `org:${siteName}:setup`;
};

/**
 * Generate cache key for organization team
 */
export const orgTeamCacheKey = (orgId: string): string => {
  return `org:${orgId}:team`;
};

/**
 * Generate cache key for organization audience
 */
export const orgAudienceCacheKey = (orgId: string): string => {
  return `org:${orgId}:audience`;
};

/**
 * Generate cache key for dashboard analytics
 */
export const dashStatsCacheKey = (orgId: string, siteName?: string): string => {
  if (siteName) {
    return `dash:${siteName}:stats`;
  }
  return `dash:${orgId}:stats`;
};

/**
 * Generate cache key for course data
 */
export const courseCacheKey = (courseId: string): string => {
  return `course:${courseId}`;
};

/**
 * Generate cache key for course by slug
 */
export const courseBySlugCacheKey = (slug: string): string => {
  return `course:slug:${slug}`;
};

/**
 * Generate cache key for user profile
 */
export const userProfileCacheKey = (userId: string): string => {
  return `user:${userId}:profile`;
};

/**
 * Generate cache key based on request context
 * Includes user ID if authenticated, otherwise uses IP
 */
export const requestCacheKey = (c: Context, prefix: string, ...parts: (string | number)[]): string => {
  const user = c.get('user');
  const baseKey = user?.id ? `user:${user.id}` : `ip:${c.req.header('cf-connecting-ip') || 'anonymous'}`;
  return [prefix, baseKey, ...parts.map(String)].join(':');
};

/**
 * Generate cache key from route path and query params
 */
export const routeCacheKey = (c: Context, prefix: string = 'route'): string => {
  const path = c.req.path;
  const query = c.req.query();
  const queryString = Object.entries(query)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const user = c.get('user');
  const userPart = user?.id ? `user:${user.id}` : 'public';

  if (queryString) {
    return `${prefix}:${path}:${queryString}:${userPart}`;
  }
  return `${prefix}:${path}:${userPart}`;
};