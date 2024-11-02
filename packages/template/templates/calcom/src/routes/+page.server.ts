import type { CourseMetadata, LandingPageContent } from '$lib/utils/types';
interface Data {
  org: LandingPageContent;
  courses: { data: CourseMetadata; lessons: number }[];
}

export const load = async ({ fetch }) => {
  const response = await fetch('/api/courses');
  if (!response.ok) {
    throw new Error('Failed to load courses data');
  }
  const data: Data = await response.json();

  return {
    org: data.org,
    courses: data.courses
  };
};
