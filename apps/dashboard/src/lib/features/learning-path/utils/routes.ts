/**
 * Route helpers for learning-path hub URLs.
 * `/paths/[publicId]` is the hub for both roles: staff get the builder and
 * learners get the hub content. Search, redirects and the placeholder all
 * point here so the URL stays stable.
 */
export function getPathHubRoute(publicId: string): string {
  return `/paths/${publicId}`;
}

// getPathCourseRoute will join this module with the LMS work, resolving a
// learner's course inside a path (path hub + in-course stepper).
