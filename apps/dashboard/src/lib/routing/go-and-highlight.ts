import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { buildHighlightPath } from './route-path';
import type { ROUTE_NAME, RouteValues, SectionsFor } from './routes';

/** Resolved href for a link that opens a route and pulses one of its sections. */
export function getHighlightHref<R extends ROUTE_NAME>(
  routeName: R,
  sectionName: SectionsFor<R>,
  routeValues: RouteValues<R>
): string {
  return resolve(buildHighlightPath(routeName, sectionName, routeValues), {});
}

export function goAndHighlight<R extends ROUTE_NAME>(
  routeName: R,
  sectionName: SectionsFor<R>,
  routeValues: RouteValues<R>
) {
  const highlightPath = buildHighlightPath(routeName, sectionName, routeValues);

  goto(resolve(highlightPath, {}), { noScroll: true, keepFocus: true });
}
