import type { NavItem } from './lms-navigation';
import { isActive } from '$lib/utils/functions/app';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

/**
 * Generate breadcrumbs from the current pathname using LMS navigation structure
 */
export function generateLmsBreadcrumbs(
  pathname: string,
  searchParams: string,
  navItems: NavItem[],
  pageData?: { breadcrumb?: string } // Optional page data for dynamic titles
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  const pathWithQuery = pathname + searchParams;

  // Remove the /lms prefix to get the relative path
  const relativePath = pathname.replace(/^\/lms/, '').replace(/^\//, '') || '';
  const pathSegments = relativePath.split('/').filter(Boolean);

  // Handle root/dashboard
  if (!relativePath || relativePath === '') {
    return breadcrumbs;
  }

  // Find the matching top-level nav item
  const firstSegment = pathSegments[0];
  let matchedNavItem: NavItem | undefined;

  for (const item of navItems) {
    // Use path for matching (works for both hash URLs and regular URLs)
    const itemPath = item.path.replace(/^\//, '');
    if (itemPath === firstSegment || (itemPath === '' && firstSegment === undefined)) {
      matchedNavItem = item;
      break;
    }
  }

  if (!matchedNavItem) {
    // Try to match by checking if pathname matches the item path
    for (const item of navItems) {
      const fullItemPath = `/lms${item.path}`;
      if (isActive(pathname, fullItemPath)) {
        matchedNavItem = item;
        break;
      }
    }
  }

  if (matchedNavItem) {
    // Handle hash URLs (like settings) - use the actual path instead of '#'
    const href = matchedNavItem.useHashUrl ? `/lms${matchedNavItem.path}` : matchedNavItem.url;

    breadcrumbs.push({
      label: matchedNavItem.title,
      href: href
    });
  }

  // Handle items with query params (like settings tabs)
  if (matchedNavItem?.items && searchParams) {
    const subItem = matchedNavItem.items.find((sub) => isActive(pathWithQuery, sub.url, undefined, true));
    if (subItem) {
      breadcrumbs.push({
        label: subItem.title,
        href: subItem.url
      });
      return breadcrumbs;
    }
  }

  // Handle nested routes
  if (pathSegments.length > 1 && matchedNavItem) {
    const secondSegment = pathSegments[1];

    // Check for static nested routes (like community/ask, settings/integrations)
    if (matchedNavItem.nestedRoutes) {
      const nestedRoute = matchedNavItem.nestedRoutes.find((route) => route.path === secondSegment);
      if (nestedRoute) {
        breadcrumbs.push({
          label: nestedRoute.titleKey, // Could be translated if needed
          href: `/lms${matchedNavItem.path}/${nestedRoute.path}`
        });
        return breadcrumbs;
      }
    }

    // Check for dynamic segments (like community/[slug])
    if (matchedNavItem.supportsDynamicSegment && secondSegment) {
      // Check if it's not a static nested route
      const isStaticRoute = matchedNavItem.nestedRoutes?.some((route) => route.path === secondSegment);
      if (!isStaticRoute && pageData?.breadcrumb) {
        breadcrumbs.push({
          label: pageData.breadcrumb,
          href: `/lms${matchedNavItem.path}/${secondSegment}`
        });
      }
      return breadcrumbs;
    }
  }

  return breadcrumbs;
}
