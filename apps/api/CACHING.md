# API Endpoint Caching Strategy

This document outlines the caching strategy for API endpoints in ClassroomIO.

## Overview

We use Redis-based caching to improve API performance and reduce database load. The caching system is designed to be:
- **Transparent**: Works seamlessly with existing routes
- **Flexible**: Supports various caching strategies
- **Safe**: Gracefully handles Redis failures
- **Maintainable**: Easy to invalidate related cache entries

## Architecture

```
Request → Cache Middleware → Check Cache → [Cache Hit] → Return Cached Response
                              ↓ [Cache Miss]
                              Route Handler → Service → Query → Database
                              ↓
                              Cache Response → Return Response
```

## Components

### 1. Cache Utility (`utils/redis/cache.ts`)

Low-level cache operations:
- `get<T>(key)`: Get cached value
- `set<T>(key, value, ttl)`: Set cached value with TTL
- `del(key)`: Delete cached value
- `delPattern(pattern)`: Delete multiple keys by pattern
- `getOrSet<T>(key, fetchFn, ttl)`: Cache-aside pattern

### 2. Cache Key Generators (`utils/redis/cache-keys.ts`)

Predefined cache key generators for common resources:
- `orgCacheKey(orgId)`: Organization data
- `orgCoursesCacheKey(siteName)`: Organization courses
- `dashStatsCacheKey(orgId, siteName)`: Dashboard analytics
- `routeCacheKey(c)`: Route-based key from request context

### 3. Cache Middleware (`middlewares/cache.ts`)

Hono middleware for automatic caching:
- Caches GET responses by default
- Configurable TTL, key generation, and conditions
- Sets `X-Cache` header (HIT/MISS)
- Gracefully handles Redis failures

### 4. Cache Invalidation (`utils/cache-invalidation.ts`)

Utilities to invalidate related cache entries:
- `invalidateOrgCache(orgId, siteName)`: Invalidate all org-related cache
- `invalidateOrgCoursesCache(siteName)`: Invalidate courses cache
- `invalidateDashStatsCache(orgId, siteName)`: Invalidate analytics cache

## Usage Examples

### Basic Caching

```typescript
import { cacheMiddleware } from '@api/middlewares/cache';

// Cache GET responses for 5 minutes (default)
.get('/courses', cacheMiddleware(), async (c) => {
  const courses = await getCourses();
  return c.json({ success: true, data: courses });
});
```

### Custom TTL

```typescript
// Cache for 10 minutes (600 seconds)
.get('/courses', cacheMiddleware({ ttl: 600 }), async (c) => {
  // Route handler
});
```

### Custom Cache Key

```typescript
import { orgCoursesCacheKey } from '@api/utils/redis/cache-keys';

// Use custom cache key based on siteName
.get('/courses', cacheMiddleware({
  keyGenerator: (c) => orgCoursesCacheKey(c.req.query('siteName'))
}), async (c) => {
  // Route handler
});
```

### Skip Caching for Authenticated Users

```typescript
// Only cache for anonymous/public requests
.get('/public-courses', cacheMiddleware({
  skipForAuthenticated: true
}), async (c) => {
  // Route handler
});
```

### Cache Multiple HTTP Methods

```typescript
// Cache both GET and HEAD requests
.use(['GET', 'HEAD'], cacheMiddleware({
  methods: ['GET', 'HEAD']
}), async (c) => {
  // Route handler
});
```

### Conditional Caching

```typescript
// Only cache if siteName query param exists
.get('/courses', cacheMiddleware({
  shouldCache: (c) => !!c.req.query('siteName')
}), async (c) => {
  // Route handler
});
```

## Cache Invalidation

### Invalidate on Data Changes

When data changes, invalidate related cache entries:

```typescript
import { invalidateOrgCache, invalidateOrgCoursesCache } from '@api/utils/cache-invalidation';

// In service layer after updating organization
export async function updateOrg(orgId: string, data: Partial<TOrganization>) {
  const org = await updateOrganization(orgId, data);
  
  // Invalidate related cache entries
  await invalidateOrgCache(orgId, org.siteName);
  
  return org;
}

// After creating/updating courses
export async function createCourse(data: TNewCourse) {
  const course = await createCourseQuery(data);
  
  // Invalidate courses cache for the organization
  await invalidateOrgCoursesCache(data.siteName);
  
  return course;
}
```

### Pattern-Based Invalidation

```typescript
import { invalidateCachePattern } from '@api/utils/cache-invalidation';

// Invalidate all course-related cache
await invalidateCachePattern('course:*');

// Invalidate all dashboard stats
await invalidateCachePattern('dash:*');
```

## Best Practices

### 1. Cache Read-Heavy Endpoints

✅ **Good candidates for caching:**
- Public course listings
- Organization public data
- Dashboard analytics (with reasonable TTL)
- Static or semi-static content

❌ **Avoid caching:**
- User-specific data (unless using user-specific keys)
- Real-time data (notifications, live updates)
- Mutations (POST, PUT, DELETE)
- Sensitive data that changes frequently

### 2. Choose Appropriate TTL

- **Short TTL (60-300s)**: Frequently changing data (analytics, stats)
- **Medium TTL (300-1800s)**: Semi-static data (course listings, org info)
- **Long TTL (1800-3600s)**: Mostly static data (public pages, static content)

### 3. Use Descriptive Cache Keys

```typescript
// ✅ Good: Descriptive and scoped
orgCoursesCacheKey(siteName)  // "org:acme:courses"

// ❌ Bad: Generic and ambiguous
"data"  // Too generic
```

### 4. Invalidate Related Cache

When updating data, invalidate all related cache entries:

```typescript
// When updating organization
await invalidateOrgCache(orgId, siteName);  // Invalidates org, courses, setup, etc.

// When updating a course
await invalidateOrgCoursesCache(siteName);  // Invalidates courses and setup
```

### 5. Handle Cache Failures Gracefully

The middleware handles Redis failures by default (`skipOnError: true`). If Redis is down, requests continue without caching.

### 6. Monitor Cache Performance

Check `X-Cache` header in responses:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response fetched and cached

## Implementation Checklist

When adding caching to a route:

- [ ] Identify if endpoint is cacheable (read-heavy, public/semi-public data)
- [ ] Choose appropriate TTL based on data freshness requirements
- [ ] Use or create appropriate cache key generator
- [ ] Add cache middleware to route
- [ ] Identify related cache entries that need invalidation
- [ ] Add cache invalidation in service layer when data changes
- [ ] Test cache hit/miss scenarios
- [ ] Monitor cache performance in production

## Example: Complete Implementation

### Route with Caching

```typescript
// apps/api/src/routes/organization/organization.ts
import { cacheMiddleware } from '@api/middlewares/cache';
import { orgCoursesCacheKey } from '@api/utils/redis/cache-keys';

.get('/courses', 
  cacheMiddleware({
    ttl: 600, // 10 minutes
    keyGenerator: (c) => orgCoursesCacheKey(c.req.valid('query').siteName)
  }),
  zValidator('query', ZGetCoursesBySiteName),
  async (c) => {
    try {
      const { siteName } = c.req.valid('query');
      const courses = await getCoursesByOrgSiteName(siteName);
      return c.json({ success: true, data: courses }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch courses');
    }
  }
)
```

### Service with Cache Invalidation

```typescript
// apps/api/src/services/organization.ts
import { invalidateOrgCoursesCache } from '@api/utils/cache-invalidation';

export async function createCourse(data: TNewCourse) {
  const course = await createCourseQuery(data);
  
  // Invalidate cache after creating course
  await invalidateOrgCoursesCache(data.siteName);
  
  return course;
}
```

## Troubleshooting

### Cache Not Working

1. **Check Redis connection**: Verify `REDIS_URL` is set correctly
2. **Check TTL**: Ensure TTL is not 0 or negative
3. **Check key generation**: Verify cache keys are consistent
4. **Check middleware order**: Cache middleware should be before route handler

### Stale Data

1. **Reduce TTL**: Use shorter TTL for frequently changing data
2. **Add invalidation**: Ensure cache is invalidated when data changes
3. **Check invalidation logic**: Verify invalidation is called correctly

### High Memory Usage

1. **Review TTL values**: Reduce TTL for less critical data
2. **Review cache keys**: Ensure keys are not too granular
3. **Monitor Redis**: Check Redis memory usage and set limits

## Performance Considerations

- **Cache Hit Rate**: Aim for 70-90% cache hit rate for optimal performance
- **TTL vs Freshness**: Balance between cache duration and data freshness
- **Memory Usage**: Monitor Redis memory and set appropriate eviction policies
- **Network Latency**: Cache reduces database load but adds Redis round-trip (usually <1ms)

## Future Enhancements

- [ ] Cache warming for frequently accessed endpoints
- [ ] Cache versioning for breaking changes
- [ ] Distributed cache invalidation (pub/sub)
- [ ] Cache analytics and monitoring
- [ ] Automatic TTL adjustment based on access patterns