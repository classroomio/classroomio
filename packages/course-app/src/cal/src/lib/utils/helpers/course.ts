import type { Course, Lesson, Section } from '$lib/utils/types/course';

const DYNAMIC_KEYS_START = 3;
let courses: Course[] = [];

export async function getCourse(slug: string): Promise<Course> {
  // Get all markdown and metadata files in courses directory
  const metadataFiles = import.meta.glob(`/src/courses/**/metadata.json`, { eager: true });

  let course: Course | undefined;
  const sections: Section[] = [];

  for (const [metadataPath, _metadata] of Object.entries(metadataFiles)) {
    const [courseSlug, sectionSlug] = metadataPath.split('/').slice(DYNAMIC_KEYS_START);

    if (courseSlug !== slug) {
      continue;
    }

    if (sectionSlug === 'metadata.json') {
      const metadata = (_metadata as { default: Course }).default;
      course = {
        ...metadata,
        slug
      };

      continue;
    }

    const lessons = await getSectionLessons(courseSlug, sectionSlug);

    const metadata = (_metadata as { default: Section }).default;
    sections.push({
      ...metadata,
      sectionSlug,
      children: lessons
    });
  }

  if (!course) {
    throw new Error(`Course with slug "${slug}" not found`);
  }

  course.sections = sections;

  return course;
}

async function getSectionLessons(cSlug: string, sSlug: string): Promise<Lesson[]> {
  const lessons: Lesson[] = [];

  const mdFiles = import.meta.glob(`/src/courses/**/*.md`);

  for (const [mdPath, md] of Object.entries(mdFiles)) {
    const [courseSlug, sectionSlug, lessonSlug] = mdPath.split('/').slice(DYNAMIC_KEYS_START);

    if (courseSlug !== cSlug || sectionSlug !== sSlug) {
      continue;
    }

    const lesson = (await md()) as {
      metadata: Lesson;
    };

    lessons.push({ ...lesson.metadata, filename: lessonSlug });
  }

  return lessons;
}

export async function getCourses(): Promise<Course[]> {
  if (courses.length > 0) {
    return courses;
  }

  console.time('FETCH COURSES STAT');

  // Get all markdown and metadata files in courses directory
  const mdFiles = import.meta.glob('/src/courses/**/*.md');
  const metadataFiles = import.meta.glob('/src/courses/*/metadata.json', { eager: true });

  // Process metadata files to build courses array
  courses = await Promise.all(
    Object.entries(metadataFiles).map(async ([metadataPath, _metadata]) => {
      // Extract course folder name as slug
      const pathParts = metadataPath.split('/');
      const slug = pathParts[pathParts.length - 2];

      // Count .md files for this course
      const lessonsCount = Object.keys(mdFiles).filter((path) =>
        path.startsWith(`/src/courses/${slug}/`)
      ).length;

      const metadata = (_metadata as { default: Course }).default;
      return {
        ...metadata,
        slug,
        lessonsCount
      };
    })
  );

  console.timeEnd('FETCH COURSES STAT');

  return courses;
}
