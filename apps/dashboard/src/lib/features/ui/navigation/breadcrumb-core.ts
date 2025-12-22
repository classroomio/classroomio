import { isActive } from '$lib/utils/functions/app';

/**
 * Unified breadcrumb system that addresses all scalability limitations
 */

export interface BreadcrumbItem {
  label: string;
  href: string;
  metadata?: Record<string, unknown>;
}

export interface NestedRouteConfig {
  path: string;
  titleKey: string;
  // Optional: Custom resolver for dynamic titles
  titleResolver?: (params: Record<string, string>) => string | Promise<string>;
  // Optional: Nested routes can have their own nested routes (multi-level support)
  nestedRoutes?: NestedRouteConfig[];
  // Optional: Supports dynamic segments within nested routes
  supportsDynamicSegment?: boolean;
}

export interface NavItem {
  title: string;
  url: string;
  path: string;
  icon?: unknown;
  isActive?: boolean;
  isExpanded?: boolean;
  items?: NavItem[];
  useHashUrl?: boolean;
  nestedRoutes?: NestedRouteConfig[];
  supportsDynamicSegment?: boolean;
  // NEW: Route-specific breadcrumb overrides
  breadcrumbLabel?: string;
  breadcrumbResolver?: (params: Record<string, string>) => string | Promise<string>;
}

/**
 * Configuration for breadcrumb generation context
 */
export interface BreadcrumbConfig {
  /**
   * Path prefix to remove from pathname (e.g., '/lms', '/org/[slug]')
   * Can be a string or a function that extracts the prefix dynamically
   */
  pathPrefix: string | ((pathname: string) => string);
  
  /**
   * Base path for generating hrefs (e.g., '/lms', '/org/myorg')
   */
  basePath: string | ((pathname: string) => string);
  
  /**
   * Resolver for dynamic segment titles
   * Can resolve from page.data, stores, or API calls
   */
  dynamicTitleResolver?: (
    segment: string,
    parentPath: string,
    fullPathname: string,
    context?: unknown
  ) => string | Promise<string> | null | undefined;
  
  /**
   * Optional: Cache breadcrumbs for better performance
   */
  enableCache?: boolean;
  
  /**
   * Optional: Maximum breadcrumb depth (prevents infinite recursion)
   */
  maxDepth?: number;
}

/**
 * Cache for breadcrumb generation (simple in-memory cache)
 */
const breadcrumbCache = new Map<string, BreadcrumbItem[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  const now = Date.now();
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > CACHE_TTL) {
      breadcrumbCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
}

/**
 * Get cached breadcrumbs or generate new ones
 */
function getCachedOrGenerate(
  cacheKey: string,
  generator: () => BreadcrumbItem[],
  enableCache: boolean
): BreadcrumbItem[] {
  if (!enableCache) {
    return generator();
  }

  clearExpiredCache();
  
  const cached = breadcrumbCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = generator();
  breadcrumbCache.set(cacheKey, result);
  cacheTimestamps.set(cacheKey, Date.now());
  return result;
}

/**
 * Extract path prefix from pathname
 */
function extractPathPrefix(
  pathname: string,
  prefixConfig: string | ((pathname: string) => string)
): string {
  if (typeof prefixConfig === 'function') {
    return prefixConfig(pathname);
  }
  
  // Handle dynamic prefixes like '/org/[slug]'
  if (prefixConfig.includes('[')) {
    const pattern = prefixConfig.replace(/\[.*?\]/g, '[^/]+');
    const match = pathname.match(new RegExp(`^${pattern}`));
    return match ? match[0] : '';
  }
  
  return pathname.startsWith(prefixConfig) ? prefixConfig : '';
}

/**
 * Get base path for href generation
 */
function getBasePath(
  pathname: string,
  basePathConfig: string | ((pathname: string) => string)
): string {
  if (typeof basePathConfig === 'function') {
    return basePathConfig(pathname);
  }
  return basePathConfig;
}

/**
 * Find matching navigation item for a path segment
 */
function findMatchingNavItem(
  segment: string,
  navItems: NavItem[],
  fullPathname: string,
  basePath: string
): NavItem | undefined {
  // First try exact path match
  for (const item of navItems) {
    const itemPath = item.path.replace(/^\//, '');
    if (itemPath === segment || (itemPath === '' && segment === undefined)) {
      return item;
    }
  }

  // Fallback: use isActive matching
  for (const item of navItems) {
    const fullItemPath = `${basePath}${item.path}`;
    if (isActive(fullPathname, fullItemPath)) {
      return item;
    }
  }

  return undefined;
}

/**
 * Resolve dynamic title for a segment
 */
async function resolveDynamicTitle(
  segment: string,
  parentPath: string,
  fullPathname: string,
  navItem: NavItem,
  config: BreadcrumbConfig,
  context?: unknown
): Promise<string | null> {
  // Check for route-specific resolver first
  if (navItem.breadcrumbResolver) {
    const params = extractParamsFromPath(fullPathname, parentPath);
    const result = navItem.breadcrumbResolver(params);
    return result instanceof Promise ? await result : result;
  }

  // Check for nested route resolver
  if (navItem.nestedRoutes) {
    const nestedRoute = navItem.nestedRoutes.find((route) => {
      // Check if this is a dynamic segment
      if (route.supportsDynamicSegment) {
        return true;
      }
      return route.path === segment;
    });

    if (nestedRoute?.titleResolver) {
      const params = extractParamsFromPath(fullPathname, parentPath);
      const result = nestedRoute.titleResolver(params);
      return result instanceof Promise ? await result : result;
    }
  }

  // Use global dynamic title resolver
  if (config.dynamicTitleResolver) {
    const result = config.dynamicTitleResolver(segment, parentPath, fullPathname, context);
    return result instanceof Promise ? await result : result || null;
  }

  return null;
}

/**
 * Extract parameters from pathname (e.g., { slug: 'my-post' })
 */
function extractParamsFromPath(
  pathname: string,
  parentPath: string
): Record<string, string> {
  const params: Record<string, string> = {};
  const relativePath = pathname.replace(parentPath, '').replace(/^\//, '');
  const segments = relativePath.split('/').filter(Boolean);
  
  // Simple extraction - can be enhanced for more complex patterns
  segments.forEach((segment, index) => {
    params[`param${index}`] = segment;
  });
  
  return params;
}

/**
 * Recursively generate breadcrumbs for nested routes
 */
async function generateNestedBreadcrumbs(
  segments: string[],
  navItem: NavItem,
  currentPath: string,
  basePath: string,
  fullPathname: string,
  searchParams: string,
  config: BreadcrumbConfig,
  context?: unknown,
  depth: number = 0
): Promise<BreadcrumbItem[]> {
  const breadcrumbs: BreadcrumbItem[] = [];
  const maxDepth = config.maxDepth ?? 10;

  if (depth >= maxDepth || segments.length === 0) {
    return breadcrumbs;
  }

  const currentSegment = segments[0];
  const remainingSegments = segments.slice(1);
  const segmentPath = `${currentPath}/${currentSegment}`;

  // Check for static nested route
  if (navItem.nestedRoutes) {
    const nestedRoute = navItem.nestedRoutes.find((route) => route.path === currentSegment);
    
    if (nestedRoute) {
      breadcrumbs.push({
        label: nestedRoute.titleKey,
        href: `${basePath}${segmentPath}`
      });

      // Recursively handle nested routes within nested routes
      if (remainingSegments.length > 0 && nestedRoute.nestedRoutes) {
        const nestedBreadcrumbs = await generateNestedBreadcrumbs(
          remainingSegments,
          { ...navItem, nestedRoutes: nestedRoute.nestedRoutes } as NavItem,
          segmentPath,
          basePath,
          fullPathname,
          searchParams,
          config,
          context,
          depth + 1
        );
        breadcrumbs.push(...nestedBreadcrumbs);
      }

      return breadcrumbs;
    }
  }

  // Handle dynamic segment
  if (navItem.supportsDynamicSegment || 
      navItem.nestedRoutes?.some((route) => route.supportsDynamicSegment && route.path !== currentSegment)) {
    const dynamicTitle = await resolveDynamicTitle(
      currentSegment,
      currentPath,
      fullPathname,
      navItem,
      config,
      context
    );

    if (dynamicTitle) {
      breadcrumbs.push({
        label: dynamicTitle,
        href: `${basePath}${segmentPath}`
      });

      // Continue with remaining segments if there are nested routes that support deeper nesting
      if (remainingSegments.length > 0) {
        // Check if current nav item has nested routes that support further nesting
        const supportingNestedRoute = navItem.nestedRoutes?.find(
          (route) => route.supportsDynamicSegment && route.nestedRoutes
        );
        
        if (supportingNestedRoute) {
          const nestedBreadcrumbs = await generateNestedBreadcrumbs(
            remainingSegments,
            { ...navItem, nestedRoutes: supportingNestedRoute.nestedRoutes } as NavItem,
            segmentPath,
            basePath,
            fullPathname,
            searchParams,
            config,
            context,
            depth + 1
          );
          breadcrumbs.push(...nestedBreadcrumbs);
        }
      }
    }
  }

  return breadcrumbs;
}

/**
 * Unified breadcrumb generator that works for all contexts
 */
export async function generateBreadcrumbs(
  pathname: string,
  searchParams: string,
  navItems: NavItem[],
  config: BreadcrumbConfig,
  context?: unknown
): Promise<BreadcrumbItem[]> {
  const cacheKey = `${pathname}${searchParams}`;
  
  return getCachedOrGenerate(
    cacheKey,
    () => generateBreadcrumbsSync(pathname, searchParams, navItems, config, context),
    config.enableCache ?? false
  );
}

/**
 * Synchronous version (for cases where async isn't needed)
 * Note: Dynamic title resolvers that return promises won't work here
 */
export function generateBreadcrumbsSync(
  pathname: string,
  searchParams: string,
  navItems: NavItem[],
  config: BreadcrumbConfig,
  context?: unknown
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  const pathWithQuery = pathname + searchParams;

  // Extract path prefix and base path
  const pathPrefix = extractPathPrefix(pathname, config.pathPrefix);
  const basePath = getBasePath(pathname, config.basePath);
  
  // Get relative path after removing prefix
  const relativePath = pathname.replace(pathPrefix, '').replace(/^\//, '') || '';
  const pathSegments = relativePath.split('/').filter(Boolean);

  // Handle root/dashboard
  if (!relativePath || relativePath === '') {
    return breadcrumbs;
  }

  // Find matching top-level nav item
  const firstSegment = pathSegments[0];
  const matchedNavItem = findMatchingNavItem(firstSegment, navItems, pathname, basePath);

  if (!matchedNavItem) {
    return breadcrumbs;
  }

  // Add parent breadcrumb
  const parentHref = matchedNavItem.useHashUrl 
    ? `${basePath}${matchedNavItem.path}` 
    : matchedNavItem.url;
  
  breadcrumbs.push({
    label: matchedNavItem.breadcrumbLabel || matchedNavItem.title,
    href: parentHref
  });

  // Handle query params (settings tabs, etc.)
  if (matchedNavItem.items && searchParams) {
    const subItem = matchedNavItem.items.find((sub) => 
      isActive(pathWithQuery, sub.url, undefined, true)
    );
    
    if (subItem) {
      breadcrumbs.push({
        label: subItem.breadcrumbLabel || subItem.title,
        href: subItem.url
      });
      return breadcrumbs;
    }
  }

  // Handle nested routes (recursive)
  if (pathSegments.length > 1) {
    const remainingSegments = pathSegments.slice(1);
    const parentPath = `${basePath}${matchedNavItem.path}`;
    
    // Note: For async resolvers, you'd need to use generateBreadcrumbs instead
    const nestedBreadcrumbs = generateNestedBreadcrumbsSync(
      remainingSegments,
      matchedNavItem,
      matchedNavItem.path,
      basePath,
      pathname,
      searchParams,
      config,
      context
    );
    
    breadcrumbs.push(...nestedBreadcrumbs);
  }

  return breadcrumbs;
}

/**
 * Synchronous version of nested breadcrumb generation
 */
function generateNestedBreadcrumbsSync(
  segments: string[],
  navItem: NavItem,
  currentPath: string,
  basePath: string,
  fullPathname: string,
  searchParams: string,
  config: BreadcrumbConfig,
  context?: unknown,
  depth: number = 0
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  const maxDepth = config.maxDepth ?? 10;

  if (depth >= maxDepth || segments.length === 0) {
    return breadcrumbs;
  }

  const currentSegment = segments[0];
  const remainingSegments = segments.slice(1);
  const segmentPath = `${currentPath}/${currentSegment}`;

  // Check for static nested route
  if (navItem.nestedRoutes) {
    const nestedRoute = navItem.nestedRoutes.find((route) => route.path === currentSegment);
    
    if (nestedRoute) {
      breadcrumbs.push({
        label: nestedRoute.titleKey,
        href: `${basePath}${segmentPath}`
      });

      // Recursively handle nested routes
      if (remainingSegments.length > 0 && nestedRoute.nestedRoutes) {
        const nestedBreadcrumbs = generateNestedBreadcrumbsSync(
          remainingSegments,
          { ...navItem, nestedRoutes: nestedRoute.nestedRoutes } as NavItem,
          segmentPath,
          basePath,
          fullPathname,
          searchParams,
          config,
          context,
          depth + 1
        );
        breadcrumbs.push(...nestedBreadcrumbs);
      }

      return breadcrumbs;
    }
  }

  // Handle dynamic segment
  if (navItem.supportsDynamicSegment) {
    // Try to resolve title synchronously (from context if available)
    let dynamicTitle: string | null = null;
    
    if (config.dynamicTitleResolver) {
      const result = config.dynamicTitleResolver(
        currentSegment,
        currentPath,
        fullPathname,
        context
      );
      // Only use if it's not a promise
      if (typeof result === 'string') {
        dynamicTitle = result;
      }
    }

    if (dynamicTitle) {
      breadcrumbs.push({
        label: dynamicTitle,
        href: `${basePath}${segmentPath}`
      });

      // Continue with remaining segments
      if (remainingSegments.length > 0) {
        const supportingNestedRoute = navItem.nestedRoutes?.find(
          (route) => route.supportsDynamicSegment && route.nestedRoutes
        );
        
        if (supportingNestedRoute?.nestedRoutes) {
          const nestedBreadcrumbs = generateNestedBreadcrumbsSync(
            remainingSegments,
            { ...navItem, nestedRoutes: supportingNestedRoute.nestedRoutes } as NavItem,
            segmentPath,
            basePath,
            fullPathname,
            searchParams,
            config,
            context,
            depth + 1
          );
          breadcrumbs.push(...nestedBreadcrumbs);
        }
      }
    }
  }

  return breadcrumbs;
}

/**
 * Clear breadcrumb cache (useful for testing or manual cache invalidation)
 */
export function clearBreadcrumbCache() {
  breadcrumbCache.clear();
  cacheTimestamps.clear();
}

