import type { courseCompletion } from "$lib/utils/types";

const ROUTES = {
  COURSES: 'courses',
  PATHWAYS: 'pathways'
};

export function getIsCourseComplete(
  completions: courseCompletion[],
  profileId: string | undefined
): boolean {
  if (!Array.isArray(completions)) return false;
  return completions.some((c) => {
    return c.is_complete && c.profile_id === profileId;
  });
}


export function getPathwayNavItemRoute(pathwayId, routeId) {
  const path = `/${ROUTES.PATHWAYS}/${pathwayId}`;

  if (!routeId) {
    return path;
  }

  return `${path}/${routeId}`;
}