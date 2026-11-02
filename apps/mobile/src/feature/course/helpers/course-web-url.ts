import { useOrgWebHost } from '@/feature/org/helpers/org-web-host';

/** Builds a course's address on the organization's learner site; returns null when the site address is unknown. */
export function useCourseWebUrl() {
  const host = useOrgWebHost();

  return (courseId: string) => (host ? `https://${host}/courses/${courseId}` : null);
}
