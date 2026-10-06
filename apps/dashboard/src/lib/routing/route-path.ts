import { ROUTE_PATHS, type ROUTE_NAME, type RouteValues, type SectionsFor } from './routes';

/**
 * Fills a route's `[param]` tokens from `routeValues`; any value without a matching token becomes a query param.
 * Returns an unresolved app path, so callers pass it through `resolve()` before navigating or rendering a link.
 */
export function buildRoutePath<R extends ROUTE_NAME>(routeName: R, routeValues: RouteValues<R>): string {
  let path: string = ROUTE_PATHS[routeName];
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(routeValues)) {
    if (value == null) continue;

    const token = `[${key}]`;
    if (path.includes(token)) {
      path = path.replace(token, encodeURIComponent(value));
    } else {
      query.set(key, value);
    }
  }

  const search = query.toString();

  return search ? `${path}?${search}` : path;
}

/** Same as {@link buildRoutePath}, plus the `highlight` param `AttentionHighlight` reads on the destination page. */
export function buildHighlightPath<R extends ROUTE_NAME>(
  routeName: R,
  sectionName: SectionsFor<R>,
  routeValues: RouteValues<R>
): string {
  const highlightValues = { ...routeValues, highlight: sectionName } as RouteValues<R>;

  return buildRoutePath(routeName, highlightValues);
}
