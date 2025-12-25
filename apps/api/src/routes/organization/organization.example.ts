/**
 * Example: Organization routes with caching
 * This file demonstrates how to add caching to organization endpoints
 * 
 * To use caching in your routes, import cacheMiddleware and apply it:
 */

import { cacheMiddleware } from '@api/middlewares/cache';
import { orgCoursesCacheKey, orgSetupCacheKey } from '@api/utils/redis/cache-keys';
import { zValidator } from '@hono/zod-validator';

// Example 1: Cache public courses endpoint (10 minutes)
export const exampleCoursesRoute = new Hono().get(
  '/courses',
  cacheMiddleware({
    ttl: 600, // 10 minutes
    keyGenerator: (c) => {
      const { siteName } = c.req.valid('query');
      return orgCoursesCacheKey(siteName);
    }
  }),
  zValidator('query', ZGetCoursesBySiteName),
  async (c) => {
    // Route handler
  }
);

// Example 2: Cache setup data (5 minutes, default)
export const exampleSetupRoute = new Hono().get(
  '/setup',
  cacheMiddleware({
    keyGenerator: (c) => {
      const { siteName } = c.req.valid('query');
      return orgSetupCacheKey(siteName);
    }
  }),
  zValidator('query', ZGetOrgSetup),
  async (c) => {
    // Route handler
  }
);

// Example 3: Cache for anonymous users only
export const examplePublicRoute = new Hono().get(
  '/public-data',
  cacheMiddleware({
    skipForAuthenticated: true, // Only cache for non-authenticated users
    ttl: 300
  }),
  async (c) => {
    // Route handler
  }
);

// Example 4: Conditional caching
export const exampleConditionalRoute = new Hono().get(
  '/conditional',
  cacheMiddleware({
    shouldCache: (c) => {
      // Only cache if siteName query param exists
      return !!c.req.query('siteName');
    },
    ttl: 600
  }),
  async (c) => {
    // Route handler
  }
);