import type { CourseCompletion } from "$lib/utils/types";

interface Routes {
  courses: string;
  pathways: string
}

const routes: Routes = {
  courses: 'courses',
  pathways: 'pathways'
};

export function getIsCourseComplete(
  completions: CourseCompletion[],
  profileId: string | undefined
): boolean {
  if (!Array.isArray(completions)) return false;
  return completions.some((c) => {
    return c.is_complete && c.profile_id === profileId;
  });
}


export function getPathwayNavItemRoute(pathwayId: string, routeId?: string) {
  const path = `/${routes.pathways}/${pathwayId}`;

  if (!routeId) {
    return path;
  }

  return `${path}/${routeId}`;
}
