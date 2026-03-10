/**
 * Pre-configured breadcrumb generators for different contexts
 * These wrap the core generator with context-specific configurations
 */

import type { BreadcrumbConfig } from './breadcrumb-core';

/**
 * Configuration for Org breadcrumbs
 */
export function createOrgBreadcrumbConfig(
  currentOrgPath: string,
  pageData?: { breadcrumb?: string }
): BreadcrumbConfig {
  return {
    pathPrefix: (pathname: string) => {
      // Extract org path dynamically (e.g., '/org/myorg')
      const match = pathname.match(/^\/org\/[^/]+/);
      return match ? match[0] : '';
    },
    basePath: currentOrgPath,
    dynamicTitleResolver: (segment, parentPath, fullPathname) => {
      // Use page.data.breadcrumb for server-side resolved titles
      return pageData?.breadcrumb || null;
    },
    enableCache: true,
    maxDepth: 10
  };
}

/**
 * Configuration for LMS breadcrumbs
 */
export function createLmsBreadcrumbConfig(
  dynamicTitleResolver?: (segment: string, parentPath: string, fullPathname: string) => string | null
): BreadcrumbConfig {
  return {
    pathPrefix: '/lms',
    basePath: '/lms',
    dynamicTitleResolver: dynamicTitleResolver || null,
    enableCache: true,
    maxDepth: 10
  };
}

/**
 * Helper to create LMS breadcrumb config with store-based resolver
 * The getStoreValue function will be called reactively in Svelte components
 */
export function createLmsBreadcrumbConfigWithStore(getStoreValue: () => string | null | undefined): BreadcrumbConfig {
  return createLmsBreadcrumbConfig((segment, parentPath, fullPathname) => {
    return getStoreValue() || null;
  });
}

/**
 * Helper to create Org breadcrumb config with store-based resolver
 * The getStoreValue function will be called reactively in Svelte components
 */
export function createOrgBreadcrumbConfigWithStore(
  currentOrgPath: string,
  getStoreValue: () => string | null | undefined
): BreadcrumbConfig {
  return {
    pathPrefix: (pathname: string) => {
      const match = pathname.match(/^\/org\/[^/]+/);
      return match ? match[0] : '';
    },
    basePath: currentOrgPath,
    dynamicTitleResolver: (segment, parentPath, fullPathname) => {
      return getStoreValue() || null;
    },
    enableCache: false, // Disable cache for reactive stores
    maxDepth: 10
  };
}
