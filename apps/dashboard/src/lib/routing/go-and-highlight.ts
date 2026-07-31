import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { ROUTE_PATHS, type ROUTE_NAME, type RouteValues, type SectionsFor } from './routes';

export function goAndHighlight<R extends ROUTE_NAME>(
  routeName: R,
  sectionName: SectionsFor<R>,
  routeValues: RouteValues<R>
) {
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

  query.set('highlight', sectionName);
  goto(resolve(`${path}?${query.toString()}`, {}));
}
