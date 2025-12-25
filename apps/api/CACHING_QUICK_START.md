# Caching Quick Start Guide

## Quick Reference

### 1. Add Caching to a Route

```typescript
import { cacheMiddleware } from '@api/middlewares/cache';

.get('/endpoint', cacheMiddleware({ ttl: 300 }), async (c) => {
  // Your route handler
});
```

### 2. Use Custom Cache Key

```typescript
import { cacheMiddleware } from '@api/middlewares/cache';
import { orgCoursesCacheKey } from '@api/utils/redis/cache-keys';

.get('/courses', cacheMiddleware({
  keyGenerator: (c) => orgCoursesCacheKey(c.req.query('siteName'))
}), async (c) => {
  // Your route handler
});
```

### 3. Invalidate Cache After Data Changes

```typescript
import { invalidateOrgCache } from '@api/utils/cache-invalidation';

export async function updateOrg(orgId: string, data: Partial<TOrganization>) {
  const org = await updateOrganization(orgId, data);
  
  // Invalidate related cache
  await invalidateOrgCache(orgId, org.siteName);
  
  return org;
}
```

## Common Patterns

### Pattern 1: Public Endpoint (Long TTL)

```typescript
.get('/public-courses', cacheMiddleware({
  ttl: 1800, // 30 minutes
  skipForAuthenticated: true // Only cache for anonymous users
}), async (c) => {
  // Handler
});
```

### Pattern 2: User-Specific Endpoint (Short TTL)

```typescript
.get('/dashboard/stats', cacheMiddleware({
  ttl: 60, // 1 minute
  keyGenerator: (c) => `dash:${c.get('user').id}:stats`
}), async (c) => {
  // Handler
});
```

### Pattern 3: Conditional Caching

```typescript
.get('/search', cacheMiddleware({
  shouldCache: (c) => c.req.query('q')?.length > 2, // Only cache if query exists
  ttl: 300
}), async (c) => {
  // Handler
});
```

## Cache Key Generators

Pre-defined cache key generators available in `@api/utils/redis/cache-keys`:

- `orgCacheKey(orgId)` → `"org:123"`
- `orgCoursesCacheKey(siteName)` → `"org:acme:courses"`
- `orgSetupCacheKey(siteName)` → `"org:acme:setup"`
- `dashStatsCacheKey(orgId, siteName)` → `"dash:acme:stats"`
- `routeCacheKey(c)` → Auto-generated from route path and query

## Cache Invalidation Functions

Available in `@api/utils/cache-invalidation`:

- `invalidateOrgCache(orgId, siteName)` - Invalidates all org-related cache
- `invalidateOrgCoursesCache(siteName)` - Invalidates courses cache
- `invalidateOrgTeamCache(orgId)` - Invalidates team cache
- `invalidateDashStatsCache(orgId, siteName)` - Invalidates analytics cache
- `invalidateCachePattern(pattern)` - Invalidates by pattern (e.g., `"org:*"`)

## TTL Guidelines

- **60-300s**: Frequently changing data (analytics, real-time stats)
- **300-1800s**: Semi-static data (course listings, org info)
- **1800-3600s**: Mostly static data (public pages, static content)

## Checklist

When adding caching:

- [ ] Route is read-only (GET request)
- [ ] Data doesn't change frequently OR cache invalidation is implemented
- [ ] Appropriate TTL chosen
- [ ] Cache key generator selected/created
- [ ] Cache invalidation added in service layer (if data changes)
- [ ] Tested cache hit/miss scenarios

## See Also

- Full documentation: `CACHING.md`
- Example routes: `routes/organization/organization.example.ts`
- Example services: `services/organization.example.ts`