import type { Course, Section } from '$lib/utils/types/course';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params, fetch }) => {
  const slug = params.slug || '';

  const response = await fetch(`/api/course/${slug}`);
  const course = (await response.json()) as Course;

  if (!params.section) {
    redirectToFirstLesson(course.sections, slug);
  }

  return { ...course, sections: course.sections, slug };
};

function redirectToFirstLesson(sections: Section[], slug: string) {
  const firstSection = sections[0];
  const firstLesson = firstSection.children[0];

  if (!firstSection || !firstLesson) {
    throw new Error('No course content found');
  }

  redirect(302, `/course/${slug}/${firstSection.sectionSlug}/${firstLesson.filename}`);
}
