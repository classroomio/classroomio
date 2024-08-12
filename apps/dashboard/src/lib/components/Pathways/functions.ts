import type { CourseCompletion } from '$lib/utils/types';

export function getIsCourseComplete(
  completions: CourseCompletion[],
  profileId: string | undefined
): boolean {
  if (!Array.isArray(completions)) return false;
  return completions.some((c) => {
    return c.is_complete && c.profile_id === profileId;
  });
}

export function getPathwayNavItemRoute(pathwayId = '', routeId?: string) {
  const path = `/pathways/${pathwayId}`;

  if (!routeId) {
    return path;
  }

  return `${path}/${routeId}`;
}