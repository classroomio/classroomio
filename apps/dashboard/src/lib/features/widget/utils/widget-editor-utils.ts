import type { WidgetDetail } from './types';

/** Plain deep clone — `structuredClone` throws on Svelte `$state` proxies. */
export function deepPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export type FilterPublished = 'all' | 'published' | 'unpublished';

export function buildCourseFilterPredicate(opts: {
  courseSearch: string;
  filterPublished: FilterPublished;
  filterCourseType: string;
  filterTagSlugs: string[];
}) {
  return (course: WidgetDetail['availableCourses'][number]): boolean => {
    if (opts.courseSearch && !course.title.toLowerCase().includes(opts.courseSearch.toLowerCase())) return false;
    if (opts.filterPublished === 'published' && !course.isPublished) return false;
    if (opts.filterPublished === 'unpublished' && course.isPublished) return false;
    if (opts.filterCourseType !== 'all' && course.courseType !== opts.filterCourseType) return false;
    if (
      opts.filterTagSlugs.length > 0 &&
      !opts.filterTagSlugs.some((slug) => course.tags.some((tag) => tag.slug === slug))
    )
      return false;

    return true;
  };
}
