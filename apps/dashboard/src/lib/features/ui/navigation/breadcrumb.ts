import type { NavItem } from './org-navigation';
import { isActive } from '$lib/utils/functions/app';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

/**
 * Generate breadcrumbs from the current pathname using navigation structure
 */
export function generateBreadcrumbs(
  pathname: string,
  searchParams: string,
  navItems: NavItem[],
  currentOrgPath: string,
  t: (key: string) => string,
  pageData?: { breadcrumb?: string } // Optional page data for dynamic titles
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  const pathWithQuery = pathname + searchParams;

  // Remove the org path prefix to get the relative path
  const relativePath = pathname.replace(currentOrgPath, '').replace(/^\//, '') || '';
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
    for (const item of navItems) {
      const fullItemPath = `${currentOrgPath}${item.path}`;
      if (isActive(pathname, fullItemPath, item.matchPattern)) {
        matchedNavItem = item;
        break;
      }
    }
  }

  if (matchedNavItem) {
    const parentCrumbPath =
      matchedNavItem.useHashUrl && matchedNavItem.items?.length ? matchedNavItem.items[0].path : matchedNavItem.path;
    const href = matchedNavItem.useHashUrl ? `${currentOrgPath}${parentCrumbPath}` : matchedNavItem.url;

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

  // Collapsible nav children matched by full path (e.g. Stats → Analytics, Settings → Billing)
  if (matchedNavItem?.items && !searchParams) {
    const parentBase = `${currentOrgPath}${matchedNavItem.path}`.replace(/\/$/, '');
    const normalizedPathname = pathname.replace(/\/$/, '');

    if (normalizedPathname !== parentBase) {
      const activeSub = matchedNavItem.items.find((sub) => isActive(pathname, sub.url, sub.matchPattern, true));
      if (activeSub) {
        breadcrumbs.push({
          label: activeSub.title,
          href: activeSub.url
        });

        const activeSubBase = activeSub.url.replace(/\/$/, '');
        if (normalizedPathname !== activeSubBase && activeSub.nestedRoutes && pathSegments.length > 1) {
          const activeNestedRoute = activeSub.nestedRoutes.find((route) => route.path === pathSegments[1]);

          if (activeNestedRoute) {
            breadcrumbs.push({
              label: t(activeNestedRoute.titleKey),
              href: `${currentOrgPath}${matchedNavItem.path}/${activeNestedRoute.path}`
            });
          }
        }

        return breadcrumbs;
      }
    }
  }

  // Handle nested routes
  if (pathSegments.length > 1 && matchedNavItem) {
    const secondSegment = pathSegments[1];

    // Check for static nested routes (like community/ask, settings/customize-lms)
    if (matchedNavItem.nestedRoutes) {
      const nestedRoute = matchedNavItem.nestedRoutes.find((route) => route.path === secondSegment);
      if (nestedRoute) {
        breadcrumbs.push({
          label: t(nestedRoute.titleKey), // Could be translated if needed
          href: `${currentOrgPath}${matchedNavItem.path}/${nestedRoute.path}`
        });
        return breadcrumbs;
      }
    }

    // Check for dynamic segments (like community/[slug], quiz/[slug])
    if (matchedNavItem.supportsDynamicSegment && secondSegment) {
      // Check if it's not a static nested route
      const isStaticRoute = matchedNavItem.nestedRoutes?.some((route) => route.path === secondSegment);
      if (!isStaticRoute && pageData?.breadcrumb) {
        breadcrumbs.push({
          label: t(pageData.breadcrumb),
          href: `${currentOrgPath}${matchedNavItem.path}/${secondSegment}`
        });
      }
      return breadcrumbs;
    }
  }

  return breadcrumbs;
}
